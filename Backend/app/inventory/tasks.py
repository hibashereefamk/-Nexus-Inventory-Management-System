from celery import shared_task
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import F
from django.core.mail import send_mail
from django.conf import settings

from .models import Product, Notification
from app.tasks.models import OrderAssignment

from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

User = get_user_model()

# ✅ Helper: Send realtime notification (WebSocket)
def broadcast_notification(group_name, payload):
    """
    Sends a message to a specific WebSocket group. 
    Payload should be a dict: {"type": "alert_type", "message": "..."}
    """
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "send_alert",  # Matches the method name in consumers.py
            "message": payload
        }
    )

# ✅ Unified Task: Expiry, Low Stock, and Real-time Reporting
@shared_task
def monitor_inventory_health():
    """
    Consolidated task to check stock and expiry. 
    Triggers DB notifications, WebSockets, and Email reports.
    """
    # 1. Check for Expiring Items
    urgent_items = Product.get_expiring_soon()
    for item in urgent_items:
        msg = f"URGENT: {item.name} expires soon (on {item.expiry_date})!"
        
        # Create DB Notification
        Notification.objects.get_or_create(
            title="Expiry Warning",
            message=msg,
            department=item.department,
            notification_type='EXPIRY'
        )

        # Push to React Dashboard
        broadcast_notification("inventory_alerts", {"type": "EXPIRY", "msg": msg})

        # Email Report to Managers
        send_manager_email(f"Expiry Alert: {item.name}", msg, item.department)

    # 2. Check for Low Stock
    low_stock_items = Product.objects.filter(total_stock__lte=F('min_stock_level'))
    for item in low_stock_items:
        msg = f"Low Stock: {item.name} has only {item.total_stock} left."
        
        Notification.objects.get_or_create(
            title="Low Stock Alert",
            message=msg,
            department=item.department,
            notification_type='LOW_STOCK'
        )

        broadcast_notification("inventory_alerts", {"type": "LOW_STOCK", "msg": msg})
        send_manager_email(f"Stock Alert: {item.name}", msg, item.department)

# ✅ Task: Automated Overdue Management
@shared_task
def process_overdue_tasks():
    """
    Automatically marks pending tasks as OVERDUE and alerts managers.
    """
    today = timezone.now().date()
    overdue_orders = OrderAssignment.objects.filter(
        deadline_date__lt=today,
        status__in=['PENDING', 'PACKING']
    )

    for order in overdue_orders:
        order.status = 'OVERDUE'
        order.save()

        msg = f"TASK OVERDUE: Order {order.order_number} assigned to {order.staff.username} missed the deadline."
        
        Notification.objects.create(
            title="Deadline Missed",
            message=msg,
            department=order.department
        )

        # Notify Manager in real-time
        broadcast_notification("inventory_alerts", {"type": "TASK_OVERDUE", "msg": msg})

# ✅ Helper: Email Logic
def send_manager_email(subject, message, department):
    """
    Sends an email report to all managers in a specific department.
    """
    managers = User.objects.filter(role='MANAGER', department=department).values_list('email', flat=True)
    if managers:
        send_mail(
            subject=f"Nexus System Report: {subject}",
            message=message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=list(managers),
            fail_silently=True,
        )

# ✅ New: Manager to Admin Manual Reporting Task
@shared_task
def send_admin_report(manager_id, report_text):
    """
    Triggered when a manager manually reports an issue to the Admin.
    """
    manager = User.objects.get(id=manager_id)
    admin_emails = User.objects.filter(role='ADMIN').values_list('email', flat=True)
    
    if admin_emails:
        send_mail(
            subject=f"Manager Report: {manager.department.name}",
            message=f"Manager {manager.username} reported:\n\n{report_text}",
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=list(admin_emails),
            fail_silently=False,
        )
