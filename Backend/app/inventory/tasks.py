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

        manager_emails = list(User.objects.filter(role='MANAGER', department=item.department).values_list('email', flat=True))
        if manager_emails:
            send_mail(
                subject="Nexus Inventory: Urgent Expiry Report",
                message=msg,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=manager_emails,
                fail_silently=False,
            )

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
    overdue_orders = OrderAssignment.objects.select_related('order', 'staff', 'department').filter(
        deadline_date__lt=today,
        status__in=['PENDING', 'PACKING']
    )

    for assignment in overdue_orders:
        assignment.status = 'OVERDUE'
        assignment.save()

        # 🛠️ OrderItem ഉണ്ടെങ്കിൽ അതിലെ order_number എടുക്കുക, ഇല്ലെങ്കിൽ assignment.id നൽകുക
        order_num = assignment.order.order_number if assignment.order and assignment.order.order_number else assignment.id
        
        # staff ഉണ്ടോ എന്ന് ഉറപ്പുവരുത്തുക
        staff_name = assignment.staff.username if assignment.staff else "Unassigned"

        msg = f"TASK OVERDUE: Order #{order_num} assigned to {staff_name} missed the deadline."
        
        Notification.objects.create(
            title="Deadline Missed",
            message=msg,
            department=assignment.department
        )

        # Real-time notification
        broadcast_notification("inventory_alerts", {"type": "TASK_OVERDUE", "msg": msg})
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
def check_furniture_alerts():
    # Find damaged furniture items
    damaged_items = Product.objects.filter(category__name="Furniture", is_damaged=True)
    
    for item in damaged_items:
        send_mail(
            'Furniture Damage Alert',
            f'Item {item.name} is reported as damaged. Please check.',
            'admin@nexus.com',
            ['manager@nexus.com'],
        )
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

@shared_task
def send_manager_report_to_admin(manager_id, report_data):
    admin_emails = list(User.objects.filter(role='ADMIN').values_list('email', flat=True))
    manager = User.objects.get(id=manager_id)
    
    body = f"Report from Manager {manager.username}:\n\n{report_data}"
    
    send_mail(
        subject=f"Inventory Report: {manager.department.name}",
        message=body,
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=admin_emails
    )

from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import IssueReport, Notification
from app.accounts.models import User, Department

@shared_task
def update_manager_notification_counts():
    """
    Counts unreviewed staff reports and sends a summary notification 
    to each department manager.
    """
    departments = Department.objects.all()
    for dept in departments:
        # Count unreviewed reports for this department
        pending_count = IssueReport.objects.filter(
            department=dept,
            is_reviewed_by_manager=False
        ).count()

        if pending_count > 0 and dept.manager:
            # Create a summary notification for the manager
            Notification.objects.create(
                title="Pending Staff Reports",
                message=f"You have {pending_count} staff reports waiting for review.",
                department=dept,
                notification_type='SUMMARY'
            )
    return "Counts updated and notifications sent."

@shared_task
def send_daily_department_report(department_id):
    """
    Generates and 'sends' a report of all issues in the last 24 hours.
    In a real app, this would trigger an email or PDF generation.
    """
    yesterday = timezone.now() - timedelta(days=1)
    reports = IssueReport.objects.filter(
        department_id=department_id,
        created_at__gte=yesterday
    )
    # Logic to format data as a report goes here
    return f"Report generated for department {department_id} with {reports.count()} items."
# app/inventory/apps.py
def ready(self):
    import app.inventory.signals