from django.db import models
from app.accounts.models import User, Department
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
        ('AVAILABLE', 'Available'),
        ('FLAGGED', 'Issue Reported'),
        ('PACKED', 'Packed'),
        ('SHIPPED', 'Shipped'),
    ]
    
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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')

    # Department Specific Fields
    expiry_date = models.DateField(null=True, blank=True)
    warranty_expiry = models.DateField(null=True, blank=True)
    damage_notes = models.TextField(null=True, blank=True)
    reorder_level = models.IntegerField(null=True, blank=True)

    # Management & Shipping
    assigned_staff = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='assigned_products')
    manager_deadline = models.DateField(null=True, blank=True)
    total_stock = models.IntegerField(default=0)
    min_stock_level = models.IntegerField(default=5)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='LOW')
    assigned_at = models.DateTimeField(null=True, blank=True)
    shipped_date = models.DateTimeField(null=True, blank=True)
    quantity_to_ship = models.PositiveIntegerField(default=1)
    is_overdue = models.BooleanField(default=False)
    is_damaged = models.BooleanField(default=False)
    warranty_expiry = models.DateField(null=True, blank=True)

    @property
    def is_low_stock(self):
        return self.total_stock <= self.min_stock_level

    def clean(self):
        super().clean()
        if not self.department:
            return

        dept = self.department.name.lower()

        # 1. Electronics
        if "electronics" in dept and not self.warranty_expiry:
            raise ValidationError({"warranty_expiry": "Electronics REQUIRE a warranty expiry date."})

        # 2. Furniture
        elif "furniture" in dept:
            if self.status == 'FLAGGED' and not self.damage_notes:
                raise ValidationError({"damage_notes": "Please describe the issue for the manager."})

        # 3. Food (The 10-day logic)
        elif "food" in dept:
            if not self.expiry_date:
                raise ValidationError({"expiry_date": "Food items REQUIRE an expiry date."})
            
            # Check if manager set a deadline too close to expiry
            if self.expiry_date and self.manager_deadline:
                safe_ship_limit = self.expiry_date - timedelta(days=10)
                if self.manager_deadline > safe_ship_limit:
                    raise ValidationError({
                        "manager_deadline": f"Deadline must be before {safe_ship_limit} (10 days before expiry)."
                    })

        # 4. Office
        elif "office" in dept and self.reorder_level is None:
             raise ValidationError({"reorder_level": "Set a minimum stock level for stationery."})

    def save(self, *args, **kwargs):
        # Auto-set priority based on expiry
        if self.expiry_date:
            today = timezone.now().date()
            days_until = (self.expiry_date - today).days
            if days_until <= 10:
                self.priority = 'URGENT'
            elif days_until <= 30:
                self.priority = 'HIGH'

        self.full_clean() 
        super().save(*args, **kwargs)

    @classmethod
    def get_expiring_soon(cls):
        warning_window = timezone.now().date() + timedelta(days=31)
        return cls.objects.filter(
            expiry_date__lte=warning_window,
            expiry_date__gte=timezone.now().date(),
            status='AVAILABLE'
        )

    def __str__(self):
        return f"{self.name} - {self.department.name}"

class Notification(models.Model):
    TYPES = [('LOW_STOCK', 'Low Stock'), ('DAMAGE', 'Damage'), ('EXPIRY', 'Expired')]

    title = models.CharField(max_length=100)
    message = models.TextField()
    department = models.ForeignKey(Department, on_delete=models.CASCADE)

    notification_type = models.CharField(max_length=20, choices=TYPES ,null=True, blank=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True)

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)



class IssueReport(models.Model):
    CAUSE_CHOICES = [('HUMAN', 'Human Error'), ('NATURAL', 'Natural/External'), ('OTHER', 'Other')]
    URGENCY = [('LOW', 'Low'), ('MEDIUM', 'Medium'), ('HIGH', 'High'), ('EMERGENCY', 'Emergency')]
    is_emergency = models.BooleanField(default=False)
    manager_remarks = models.TextField(blank=True, null=True) # For the "Check-Report"
    reason = models.CharField(max_length=255, blank=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='issue_reports')
    reported_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='my_reports')
    
    # The chain of command
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    is_reviewed_by_manager = models.BooleanField(default=False)
    is_escalated_to_admin = models.BooleanField(default=False)

    type = models.CharField(max_length=20, choices=[('DAMAGE', 'Damage'), ('OVERDUE', 'Overdue'), ('EXPIRY', 'Expiry')])
    cause = models.CharField(max_length=10, choices=CAUSE_CHOICES, default='OTHER')
    description = models.TextField(help_text="Reason for report")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.type} Report for {self.product.name}"