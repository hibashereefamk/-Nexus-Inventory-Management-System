# from celery import shared_task
# from .models import Product, Notification

# @shared_task
# def monitor_expiry_and_stock():
#     # 1. Find 10-day critical food items
#     urgent_items = Product.get_expiring_soon() # Using the classmethod we wrote
    
#     for item in urgent_items:
#         Notification.objects.get_or_create(
#             title="URGENT: Expiry Warning",
#             message=f"{item.name} in {item.department.name} expires in less than 31 days!",
#             department=item.department
#         )