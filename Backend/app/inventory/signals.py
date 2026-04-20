# app/inventory/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import IssueReport, Notification, Product
from app.tasks.models import OrderAssignment

@receiver(post_save, sender=IssueReport)
def create_issue_notification(sender, instance, created, **kwargs):
    if created:
        # Create DB Notification
        Notification.objects.create(
            title=f"New {instance.issue_type} Report",
            message=f"Staff {instance.reported_by.username} reported: {instance.description}",
            department=instance.department,
            notification_type=instance.issue_type, # e.g., 'DAMAGE', 'DELAY'
            product=instance.product
        )

@receiver(post_save, sender=OrderAssignment)
def check_overdue_on_save(sender, instance, **kwargs):
    if instance.status == 'OVERDUE':
        Notification.objects.get_or_create(
            title="Task Overdue",
            message=f"Order {instance.order_number} is now overdue.",
            department=instance.department,
            notification_type='DELAY'
        )