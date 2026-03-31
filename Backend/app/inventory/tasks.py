from celery import shared_task
from django.utils import timezone
from .models import Product, Notification
from django.contrib.auth import get_user_model
from django.db.models import F 
from app.tasks.models import OrderAssignment

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
User = get_user_model()


def broadcast_notification(group_name, message_data):
    """Helper to send real-time alerts to a specific group"""
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "send_alert",  # This must match a method in your Consumers
            "message": message_data
        }
    )
    
@shared_task
def monitor_expiry_and_stock():
    # 1. Check for expiring items (Class method from Product model)
    urgent_items = Product.get_expiring_soon()
    for item in urgent_items:
        Notification.objects.get_or_create(
            title="URGENT: Expiry Warning",
            message=f"{item.name} in {item.department.name} expires soon!",
            department=item.department,
            notification_type='EXPIRY' # Matches your model's TYPES
        )


    # 2. Check for Low Stock (Using min_stock_level from your model)
    low_stock_items = Product.objects.filter(total_stock__lte=F('min_stock_level'))
    for item in low_stock_items:
        Notification.objects.get_or_create(
            title="Low Stock Alert",
            message=f"{item.name} is running low ({item.total_stock} left).",
            department=item.department,
            notification_type='LOW_STOCK'
        )



@shared_task
def check_expiry_and_overdue():
    """
    Logic for: 26-alert, 27-monitor, 28-shipment.
    Checks for items that are overdue or expiring today.
    """
    today = timezone.now().date()
    
    # 1. Check for Expired Food/Items
    expired_items = Product.objects.filter(expiry_date__lte=today)
    for item in expired_items:
        notify_managers(item, f"EXPIRED: {item.name} reached expiry date {item.expiry_date}.")
    overdue_items = Product.objects.filter(due_date__lt=timezone.now()).exclude(status='SHIPPED')
    for item in overdue_items:
        notify_managers(item, f"OVERDUE SHIPMENT: Order {item.id} is past the shipping deadline!")

def notify_managers(product, message):
    managers = User.objects.filter(role='MANAGER')
    for manager in managers:
        Notification.objects.create(
            recipient=manager,
            product=product,
            message=message,
            notification_type='ALERT'
        )


@shared_task
def monitor_system_health():
    today = timezone.now()
    
    # 1. Monitor Overdue Order Assignments
    overdue_orders = OrderAssignment.objects.filter(
        deadline_date__lt=today.date(),
        status__in=['PENDING', 'PACKING']
    )
    for order in overdue_orders:
        order.status = 'OVERDUE' # Ensure 'OVERDUE' is in your STATUS_CHOICES
        order.save()
        
        Notification.objects.create(
            title="TASK OVERDUE",
            message=f"Order {order.order_number} has missed its deadline.",
            department=order.department
        )

    # 2. Monitor Expiry for Food (31-day warning)
    urgent_items = Product.get_expiring_soon()
    for item in urgent_items:
        Notification.objects.get_or_create(
            title="URGENT: Expiry Warning",
            message=f"{item.name} expires in less than 31 days!",
            department=item.department
        )



#
channel_layer = get_channel_layer()
async_to_sync(channel_layer.group_send)(
    "inventory_alerts",
    {
        "type": "send_alert",
        "message": f"{item.name} expires soon!"
    }
)