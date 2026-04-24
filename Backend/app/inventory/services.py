# app/inventory/services.py
import json
from .models import Product,IssueReport,Notification
def execute_approved_request(approval_request):
    data = json.loads(approval_request.content)
    req_type = approval_request.request_type
    product = Product.objects.get(id=data['product_id'])

    if req_type == 'DAMAGE_REPORT':
        # 1. Update Product
        product.total_stock -= int(data['qty'])
        product.save()

        # 2. Create the IssueReport (This is your permanent record)
        IssueReport.objects.create(
            product=product,
            reported_by=approval_request.submitted_by,
            department=product.department,
            type='DAMAGE',
            description=data['notes'],
            urgency='HIGH',
            is_reviewed_by_manager=True # Since it was just approved
        )

        # 3. Create Notification (For the dashboard bell)
        Notification.objects.create(
            title=f"Stock Reduced: {product.name}",
            message=f"{data['qty']} units removed due to damage. Approved by {approval_request.reviewed_by.username}",
            department=product.department,
            notification_type='DAMAGE',
            product=product
        )