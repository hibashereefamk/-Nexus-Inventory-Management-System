from django.db import models
import uuid
from app.accounts.models import User, Department
from django.utils import timezone

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
    
    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)
    def __str__(self):
        return f"{self.order_number} - {self.staff.username if self.staff else 'Unassigned'}"

class OrderItem(models.Model):
    assignment = models.ForeignKey(OrderAssignment, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('inventory.Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()