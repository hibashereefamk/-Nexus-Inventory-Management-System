from django.db import models
import uuid
from django.utils import timezone
from app.accounts.models import User, Department
from app.inventory.models import Product
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


# -------------------------------
# ORDER ITEM (Main Order Level)
# -------------------------------
class OrderItem(models.Model):

    ORDER_STATUS = [
        ('DRAFT', 'Draft'),
        ('CONFIRMED', 'Confirmed'),
        ('PROCESSING', 'Processing'),
        ('ISSUE', 'Issue Found'),
        ('SHIPPED', 'Shipped'),
        ('CANCELLED', 'Cancelled'),
    ]

    order_number = models.CharField(max_length=50, blank=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    status = models.CharField(max_length=20, choices=ORDER_STATUS, default='DRAFT')

    rejection_reason = models.TextField(null=True, blank=True)
    target_department = models.ForeignKey(Department, on_delete=models.PROTECT, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def reserve_stock(self):
        """Increase committed_stock when order is confirmed."""
        product = self.product
        if product.available_stock >= self.quantity:
            product.committed_stock += self.quantity
            product.save()
            return True
        return False

    def release_stock(self):
        """Reduce physical stock when shipment is finalized."""
        product = self.product
        product.total_stock -= self.quantity
        product.committed_stock -= self.quantity
        product.save()

    def cancel_reservation(self):
        """If order is cancelled/rejected, give the committed stock back."""
        product = self.product
        product.committed_stock -= self.quantity
        product.save()

    def confirm_order(self):
        if self.status == 'DRAFT':
            self.status = 'CONFIRMED'
            self.save()
            self.notify_task_update(is_new=True)

    def update_status_from_assignments(self):
        assignments = self.order_assignments.all()

        if assignments.filter(is_cancelled=True).exists():
            self.status = 'CANCELLED'

        elif assignments.filter(issue_status__in=['DAMAGED', 'MISSING']).exists():
            self.status = 'ISSUE'

        elif assignments.filter(status='SHIPPED').count() == assignments.count():
            self.status = 'SHIPPED'

        else:
            self.status = 'PROCESSING'

        self.save()
        self.notify_task_update(is_new=False)

    # -------------------------------
    # NOTIFICATION
    # -------------------------------
    def notify_task_update(self, is_new):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "inventory_alerts",
            {
                "type": "task_update",
                "notification_type": "task_assigned" if is_new else "status_updated",
                "message": f"Order {self.order_number} is now {self.get_status_display()}",
            }
        )

    def __str__(self):
        return f"{self.order_number}"


# -------------------------------
# ORDER ASSIGNMENT (Task Level)
# -------------------------------
class OrderAssignment(models.Model):

    # 🔹 Process flow (ONLY workflow)
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PICKING', 'Picking'),
        ('PACKING', 'Packing'),
        ('PACKED', 'Packed'),
        ('SHIPPED', 'Shipped'),
    ]

    # 🔹 Verification result
    VERIFICATION_CHOICES = [
        ('PENDING', 'Pending Verification'),
        ('PASSED', 'Verified OK'),
        ('FAILED', 'Verification Failed'),
    ]

    # 🔹 Issue tracking
    ISSUE_CHOICES = [
        ('NONE', 'No Issue'),
        ('DAMAGED', 'Damaged'),
        ('MISSING', 'Missing'),
    ]

    # 🔹 Manager approval
    APPROVAL_CHOICES = [
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    order = models.ForeignKey(
        OrderItem,
        on_delete=models.CASCADE,null=True,   # ✅ TEMPORARY
    blank=True,
        related_name='order_assignments'
    )

    manager = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_tasks')
    staff = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='assigned_orders')
    department = models.ForeignKey(Department, on_delete=models.CASCADE)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_CHOICES, default='PENDING')
    issue_status = models.CharField(max_length=20, choices=ISSUE_CHOICES, default='NONE')
    approval_status = models.CharField(max_length=20, choices=APPROVAL_CHOICES, default='PENDING')

    is_cancelled = models.BooleanField(default=False)

    assigned_at = models.DateTimeField(auto_now_add=True)
    deadline_date = models.DateField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MED', 'Medium'),
        ('HIGH', 'High'),
        ('EMER', 'Emergency'),
    ]

    priority = models.CharField(max_length=4, choices=PRIORITY_CHOICES, default='MED')

    # -------------------------------
    # CORE BUSINESS LOGIC
    # -------------------------------
    def process_verification(self, result,description=None):
        from app.inventory.models import IssueReport
        if result == 'PASSED':
            self.verification_status = 'PASSED'
            self.issue_status = 'NONE'
            self.status = 'PACKED'
            self.approval_status = 'PENDING'

        elif result == 'FAILED':
            self.verification_status = 'FAILED'
            self.issue_status = 'DAMAGED'
            self.status = 'PACKING'  # allow rework
            self.approval_status = 'PENDING'
            IssueReport.objects.create(
                assignment=self,
                product=self.order.product,
                reported_by=self.staff,
                department=self.department,
                type='DAMAGE',
                description=description or "Manual verification failure"
            )

        self.save()
        self.order.update_status_from_assignments()

    def manager_decision(self, decision, remarks=None):

        if decision == 'APPROVED':

        # ✅ ONLY approval
            self.approval_status = 'APPROVED'

        # ✅ Keep packed status
            if self.verification_status == 'PASSED':
                self.status = 'PACKED'

        elif decision == 'REJECTED':

            self.approval_status = 'REJECTED'
            self.status = 'PACKING'

            report = self.issue_reports.first()

            if report:
                report.manager_remarks = remarks
                report.is_reviewed_by_manager = True
                report.save()

        self.save()
        self.order.update_status_from_assignments()

    # -------------------------------
    # AUTO ASSIGNMENT
    # -------------------------------
    @classmethod
    def suggest_staff_for_order(cls, department):
        potential_staff = User.objects.filter(
            warehouse_zone=department,
            role='staff',
            is_available=True
        )

        staff_with_load = potential_staff.annotate(
            active_task_count=models.Count(
                'assigned_orders',
                filter=models.Q(status__in=['PENDING', 'PICKING', 'PACKING'])
            )
        )

        return staff_with_load.order_by(
            'active_task_count', 'avg_packing_time_mins'
        ).first()

    def __str__(self):
        return f"{self.order.order_number} - {self.staff.username if self.staff else 'Unassigned'}"