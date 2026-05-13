import uuid
from django.db import models
from app.accounts.models import User, SystemLog,Department
from app.requests.models import ApprovalRequest
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta

class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField() 
    department = models.ForeignKey(Department, on_delete=models.CASCADE, null=True, 
        blank=True
    )

    def __str__(self):
        return self.name

class Product(models.Model):
    STATUS_CHOICES = [
    ('IN_STOCK', 'In Stock'),
    ('RESERVED', 'Reserved'),  # Sold but not yet out the door
    ('OUT_OF_STOCK', 'Out of Stock'),
    ('DAMAGED', 'Damaged/Quarantine'),
    ('DISCONTINUED', 'Discontinued'),
]

# Add this to your Product class

    
    PRIORITY_CHOICES = [
        ('LOW', 'Low'), 
        ('MEDIUM', 'Medium'), 
        ('HIGH', 'High'), 
        ('URGENT', 'Urgent')
    ]

    name = models.CharField(max_length=200)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    sku = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='IN_STOCK')

    # Essential Department Fields (Keep these for quick filtering/reporting)
    expiry_date = models.DateField(null=True, blank=True)
    warranty_expiry = models.DateField(null=True, blank=True) # Defined only once
    batch_number = models.CharField(max_length=50, null=True, blank=True)
    
    # Stock Management  
    total_stock = models.IntegerField(default=0, help_text="Physical items currently in the warehouse")
    committed_stock = models.IntegerField(default=0, help_text="Items reserved for orders not yet shipped")
    min_stock_level = models.IntegerField(default=5)
    reorder_level = models.IntegerField(null=True, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='LOW')

    # Logistics
    bin_location = models.CharField(max_length=20, default="AISLE-1-A",null=True, blank=True)
    
    class Meta:
        ordering = ['-id']

    @property
    def available_stock(self):
        """
        The critical ERP value: How many can we actually sell right now?
        """
        return self.total_stock - self.committed_stock

    @property
    def is_low_stock(self):
        # Professional ERPs use available_stock for low-stock alerts, not total_stock
        return self.available_stock <= self.min_stock_leve
    def update_inventory_status(self):
        """
        Sets status based on availability, not just physical presence.
        """
        if self.available_stock <= 0:
            self.status = 'OUT_OF_STOCK'
        elif self.status == 'OUT_OF_STOCK' and self.available_stock > 0:
            self.status = 'IN_STOCK'

    def generate_batch_number(self):
        """
        Example:
        MLK-20260506-AB12
        """

        sku_part = self.sku[:3].upper()

        date_part = timezone.now().strftime("%Y%m%d")

        random_part = uuid.uuid4().hex[:4].upper()

        return f"{sku_part}-{date_part}-{random_part}"
    def clean(self):
        super().clean()
        if not self.department:
            return

        dept = self.department.name.lower()
        if self.committed_stock > self.total_stock:
            raise ValidationError({
                "committed_stock": f"Cannot commit {self.committed_stock} items when you only have {self.total_stock} in total."
            })

        if "electronics" in dept and not self.warranty_expiry:
            raise ValidationError({"warranty_expiry": "Electronics REQUIRE a warranty expiry date."})

        elif "food" in dept:
            if not self.expiry_date:
                raise ValidationError({"expiry_date": "Food items REQUIRE an expiry date."})
            
            # if self.expiry_date and self.manager_deadline:
            #     safe_ship_limit = self.expiry_date - timedelta(days=10)
            #     if self.manager_deadline > safe_ship_limit:
            #         raise ValidationError({
            #             "manager_deadline": f"Deadline must be before {safe_ship_limit}."
            #         })

        elif "office" in dept and self.reorder_level is None:
            raise ValidationError({"reorder_level": "Set a minimum stock level for stationery."})

    def save(self, *args, **kwargs):
        if self.expiry_date:
            today = timezone.now().date()
            days_until = (self.expiry_date - today).days
            if days_until <= 10:
                self.priority = 'URGENT'
            elif days_until <= 30:
                self.priority = 'HIGH'

        self.update_inventory_status()
        if self.available_stock <= 0:
            self.priority = 'URGENT' # Auto-update status before saving
        self.full_clean() 
        super().save(*args, **kwargs)


    @classmethod
    def get_expiring_soon(cls):
        warning_window = timezone.now().date() + timedelta(days=31)
        return cls.objects.filter(
            expiry_date__lte=warning_window,
            expiry_date__gte=timezone.now().date(),
            status='IN_STOCK'
        )

    def __str__(self):
        return f"{self.name} -(Avail: {self.available_stock})"
@receiver(post_save, sender=Product)
def log_inventory_activity(sender, instance, created, **kwargs):
    if created:
        action_msg = f"New Product Added: {instance.name} (SKU: {instance.sku})"
    else:
        action_msg = f"Product Data Updated: {instance.name}"
    
    # User is None here because signals don't natively track the 'request' user
    SystemLog.log_event(user=None, action=action_msg) # Same product name can exist in different departments
class Notification(models.Model):
    TYPES = [('LOW_STOCK', 'Low Stock'), ('DAMAGE', 'Damage'), ('EXPIRY', 'Expired'),('ISSUE', 'Issue Reported')]

    title = models.CharField(max_length=100)
    message = models.TextField()
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    user =models.ForeignKey(User, on_delete=models.CASCADE,null=True, blank=True)
    notification_type = models.CharField(max_length=20, choices=TYPES ,null=True, blank=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True)
    is_emergency = models.BooleanField(default=False)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)



class IssueReport(models.Model):
    CAUSE_CHOICES = [('HUMAN', 'Human Error'), ('NATURAL', 'Natural/External'), ('OTHER', 'Other')]
    URGENCY_CHOICES = [('LOW', 'Low'), ('MEDIUM', 'Medium'), ('HIGH', 'High'), ('EMERGENCY', 'Emergency')]
    is_emergency = models.BooleanField(default=False)
    manager_remarks = models.TextField(blank=True, null=True) # For the "Check-Report"
    reason = models.CharField(max_length=255, blank=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='issue_reports')
    reported_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='my_reports')
    urgency = models.CharField(
        max_length=10, 
        choices=URGENCY_CHOICES, 
        default='MEDIUM'
    )
    assignment = models.ForeignKey(
        'tasks.OrderAssignment', 
        on_delete=models.CASCADE, 
        related_name='issue_reports',
        null=True, 
        blank=True
    )
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    is_reviewed_by_manager = models.BooleanField(default=False)
    is_escalated_to_admin = models.BooleanField(default=False)

    type = models.CharField(max_length=20, choices=[('DAMAGE', 'Damage'), ('OVERDUE', 'Overdue'), ('EXPIRY', 'Expiry')])
    cause = models.CharField(max_length=10, choices=CAUSE_CHOICES, default='OTHER')
    description = models.TextField(help_text="Reason for report")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.type} Report for {self.product.name}"
    
# app/inventory/models.py

class StockLog(models.Model):
    ACTION_CHOICES = [
        ('ENTRY', 'New Stock Entry'),
        ('ADJUST', 'Manual Adjustment'),
        ('EXPIRED', 'Waste: Expired'),
        ('DAMAGE', 'Waste: Damaged'),
        ('SHIP', 'Shipped to Client'),
        ('QC_FAIL', 'Quality Check Failed'),
        ('QC_PASS', 'Quality Check Passed'), 
    ]

    product = models.ForeignKey('Product', on_delete=models.CASCADE, related_name='stock_history')
    operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    action_type = models.CharField(max_length=10, choices=ACTION_CHOICES)
    
    # Tracking the change
    quantity_changed = models.IntegerField() # e.g., -10 or +50
    resulting_stock = models.IntegerField()  # The stock level after this action
    
    # Context
    reason = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Reference to the approval that authorized this
    reference_approval = models.ForeignKey(ApprovalRequest, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.product.name} | {self.action_type} | {self.quantity_changed}"
    

# app/inventory/models.py

class BaseVerification(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="%(class)s_records")
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_passed = models.BooleanField(default=True)
    comments = models.TextField(blank=True, null=True)
    
    # ADD THIS FIELD HERE
    assignment = models.ForeignKey(
        'tasks.OrderAssignment', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name="%(class)s_verifications"
    )

    class Meta:
        abstract = True
class FoodVerification(BaseVerification):
    batch_lot = models.CharField(max_length=100)
    temp_chain_ok = models.BooleanField(default=True) # Temperature check
    packaging_sealed = models.BooleanField(default=True) # No leaks
    fssai_verified = models.BooleanField(default=True) # Regulatory compliance

class FurnitureVerification(BaseVerification):
    structural_ok = models.BooleanField(default=True) # Integrity check
    finish_no_scratches = models.BooleanField(default=True) # Surface check
    parts_complete = models.BooleanField(default=True) # Assembly check (screws/tools)

class ElectronicsVerification(BaseVerification):
    unique_serial_number = models.CharField(max_length=100,null=True, blank=True) # Linking S/N to invoice
    boot_test_passed = models.BooleanField(default=False) # Dead on Arrival test
    ports_physical_ok = models.BooleanField(default=True) # USB/Charging check
    firmware_version = models.CharField(max_length=50, blank=True)

class StationeryVerification(BaseVerification):
    quantity_reconciled = models.BooleanField(default=True) # Pack count check
    ink_lead_test_passed = models.BooleanField(default=True) # Spot test
    paper_not_damaged = models.BooleanField(default=True) # Moisture/Yellowing check

