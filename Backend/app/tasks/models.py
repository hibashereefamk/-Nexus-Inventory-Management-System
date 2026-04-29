from django.db import models
import uuid
from app.accounts.models import User, Department
from django.utils import timezone
from app.inventory.models import Product, Category
# 1. Add these imports at the top
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

class OrderAssignment(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending Pickup'),
        ('PACKING', 'Packing In-Progress'),
        ('PACKED', 'Packed & Ready'),
        ('SHIPPED', 'Shipped'),
    ]

    manager = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_tasks')
    staff = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='order_assignments')
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    order_number = models.CharField(max_length=50, unique=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    assigned_at = models.DateTimeField(auto_now_add=True)
    deadline_date = models.DateField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    PRIORITY_CHOICES = [
        ('LOW', 'Low'), ('MED', 'Medium'), 
        ('HIGH', 'High'), ('EMER', 'Emergency'),
    ]
    priority = models.CharField(
        max_length=4, choices=PRIORITY_CHOICES, default='MED'
    )

    # --- THE AUTO-ASSIGNMENT LOGIC ---
    @classmethod
    def suggest_staff_for_order(cls, department):
        """
        ALGORITHM: Finds available staff specialized in the zone with the
        lowest workload and best historical efficiency.
        """
        # 1. Filter by Zone and Availability
        potential_staff = User.objects.filter(
            warehouse_zone=department,
            role='staff',
            is_available=True
        )

        # 2. FEATURE: Workload Calculation (Count Active Tasks)
        # We want to annotate each staff with their active task count
        staff_with_load = potential_staff.annotate(
            active_task_count=models.Count(
                'assigned_orders',
                filter=models.Q(status__in=['PENDING', 'PACKING'])
            )
        )

        # 3. FEATURE: Smart Ranking
        # Order by fewest tasks, then by fastest historical packing time
        best_staff = staff_with_load.order_by(
            'active_task_count', 'avg_packing_time_mins'
        ).first()

        return best_staff
    
    def save(self, *args, **kwargs):
        # Check if this is a new task or a status update
        is_new = self._state.adding
        if not self.department and self.manager:
            self.department = self.manager.department
        if not self.order_number:
            self.order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        
        super().save(*args, **kwargs)

        # 2. Trigger the notification after the save is successful
        self.notify_task_update(is_new)

    # 3. Add the notification logic as a method
    def notify_task_update(self, is_new):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
        "inventory_alerts",
        {
            "type": "task_update",  # This triggers the 'task_update' method in Consumer
            "notification_type": "task_assigned" if is_new else "status_updated",
            "message": f"Task {self.order_number} is now {self.get_status_display()}",
        }
    )

    def __str__(self):
        return f"{self.order_number} - {self.staff.username if self.staff else 'Unassigned'}"
    
class OrderItem(models.Model):
    assignment = models.ForeignKey(OrderAssignment, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('inventory.Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    is_inspected = models.BooleanField(default=False)