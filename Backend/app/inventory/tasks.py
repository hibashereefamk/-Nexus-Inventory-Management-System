from celery import shared_task
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import F

from .models import Product, Notification
from app.tasks.models import OrderAssignment

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

User = get_user_model()


# ✅ Helper: Send realtime notification (WebSocket)
def broadcast_notification(group_name, message):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "send_alert",
            "message": message
        }
    )


# ✅ Task 1: Expiry + Low Stock Monitoring
@shared_task
def monitor_expiry_and_stock():
    # 🔸 Expiring soon
    urgent_items = Product.get_expiring_soon()

    for item in urgent_items:
        msg = f"{item.name} expires soon!"

        Notification.objects.get_or_create(
            title="URGENT: Expiry Warning",
            message=msg,
            department=item.department,
            notification_type='EXPIRY'
        )

        # 🔥 Real-time alert
        broadcast_notification("inventory_alerts", msg)

    # 🔸 Low stock
    low_stock_items = Product.objects.filter(
        total_stock__lte=F('min_stock_level')
    )

    for item in low_stock_items:
        msg = f"{item.name} is running low ({item.total_stock} left)."

        Notification.objects.get_or_create(
            title="Low Stock Alert",
            message=msg,
            department=item.department,
            notification_type='LOW_STOCK'
        )

        broadcast_notification("inventory_alerts", msg)


# ✅ Task 2: Expired + Overdue Shipments
@shared_task
def check_expiry_and_overdue():
    today = timezone.now().date()

    # 🔸 Expired items
    expired_items = Product.objects.filter(expiry_date__lte=today)

    for item in expired_items:
        notify_managers(
            item,
            f"EXPIRED: {item.name} expired on {item.expiry_date}"
        )

    # 🔸 Overdue shipments
    overdue_items = Product.objects.filter(
        due_date__lt=timezone.now()
    ).exclude(status='SHIPPED')

    for item in overdue_items:
        notify_managers(
            item,
            f"OVERDUE: Order {item.id} missed deadline!"
        )


# ✅ Helper: Notify Managers
def notify_managers(product, message):
    managers = User.objects.filter(role='MANAGER')

    for manager in managers:
        Notification.objects.create(
            recipient=manager,
            product=product,
            message=message,
            notification_type='ALERT'
        )


# ✅ Task 3: System Health Monitoring
@shared_task
def monitor_system_health():
    today = timezone.now()

    # 🔸 Overdue Orders
    overdue_orders = OrderAssignment.objects.filter(
        deadline_date__lt=today.date(),
        status__in=['PENDING', 'PACKING']
    )

    for order in overdue_orders:
        order.status = 'OVERDUE'
        order.save()

        Notification.objects.create(
            title="TASK OVERDUE",
            message=f"Order {order.order_number} missed deadline.",
            department=order.department
        )

    # 🔸 Expiry Warning (31 days)
    urgent_items = Product.get_expiring_soon()

    for item in urgent_items:
        Notification.objects.get_or_create(
            title="Expiry Warning",
            message=f"{item.name} expires in less than 31 days!",
            department=item.department
        )


# ✅ Task 4: Low Stock Only (Optional separate task)
@shared_task
def check_low_stock_alerts():
    low_stock_items = Product.objects.filter(
        total_stock__lte=F('min_stock_level')
    )

    for item in low_stock_items:
        msg = f"{item.name} is running low ({item.total_stock} left)."

        Notification.objects.get_or_create(
            title="Low Stock Alert",
            message=msg,
            department=item.department,
            notification_type='LOW_STOCK'
        )

        broadcast_notification("inventory_alerts", msg)