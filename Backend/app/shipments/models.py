from django.db import models
from app.accounts.models import User,Department
from app.inventory.models import Product,Category


class ShipmentTask(models.Model):
    order_number = models.CharField(max_length=100, unique=True, default="ORD-001")
    manager = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks')
    staff_assigned = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shipment_tasks')
    department = models.ForeignKey(Department, on_delete=models.CASCADE)

    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity_to_ship = models.PositiveIntegerField()

    packing_deadline = models.DateTimeField()
    shipping_deadline = models.DateTimeField()
    is_expiry_checked = models.BooleanField(default=False) # For Food
    is_damage_verified = models.BooleanField(default=False) # For Furniture
    is_warranty_activated = models.BooleanField(default=False) # For Electronics

    status = models.CharField(max_length=20, choices=[
        ('PENDING', 'Pending'),
        ('PACKING', 'In Progress'),
        ('SHIPPED', 'Completed'),
        ('OVERDUE', 'Overdue')
    ], default='PENDING')

    def __str__(self):
        return f"{self.order_number} - {self.product.name}"
