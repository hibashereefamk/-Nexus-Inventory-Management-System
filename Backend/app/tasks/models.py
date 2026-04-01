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
    
    def save(self, *args, **kwargs):
        # Check if this is a new task or a status update
        is_new = self._state.adding
        
        if not self.order_number:
            self.order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        
        super().save(*args, **kwargs)

        # 2. Trigger the notification after the save is successful
        self.notify_task_update(is_new)

    # 3. Add the notification logic as a method
    def notify_task_update(self, is_new):
        channel_layer = get_channel_layer()
        notification_type = "task_assigned" if is_new or self.status == 'PENDING' else "status_updated"
        
        async_to_sync(channel_layer.group_send)(
            "inventory_alerts",  # Matches the group in your Consumer
            {
                "type": "task_update",  # Matches the handler in your Consumer
                "notification_type": notification_type,
                "message": f"Task {self.order_number} is now {self.get_status_display()}",
                "task_id": self.id,
                "status": self.status
            }
        )

    def __str__(self):
        return f"{self.order_number} - {self.staff.username if self.staff else 'Unassigned'}"
    
class OrderItem(models.Model):
    assignment = models.ForeignKey(OrderAssignment, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('inventory.Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    is_inspected = models.BooleanField(default=False)