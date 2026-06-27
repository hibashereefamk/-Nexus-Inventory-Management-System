from urllib import request

from rest_framework import generics, permissions
from rest_framework.views import APIView
from app.tasks.models import OrderAssignment
from .models import Product,IssueReport,Notification, StockLog
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import status
from app.accounts.permissions import IsManager,IsStaffFromDepartment,IsSuperAdmin
from .seriliazers import(  FoodVerificationSerializer, ProductSerializer,CategorySerializer,NotificationSerializer,IssueReportserializer,
                         FurnitureVerificationSerializer, ElectronicsVerificationSerializer, StationeryVerificationSerializer)
from app.accounts.models import  SystemLog
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from django.db.models import F
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import FoodVerification, FurnitureVerification, ElectronicsVerification, StationeryVerification, IssueReport, Notification
from app.tasks.models import OrderAssignment

from rest_framework import generics
from app.accounts.models import User
from app.accounts.serializers import UserSerializer # Ensure you have a basic UserSerializer
from app.accounts.permissions import IsManager,IsSuperAdmin

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_product(request):
    # Enforce logic: Only Admin and Manager
    if not request.user.is_management:
        # LOG SECURITY ATTEMPT
        SystemLog.log_event(request.user, "UNAUTHORIZED: Attempted to add product", request)
        return Response(
            {"detail": "You do not have permission to perform this action."}, 
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = ProductSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        # LOG SUCCESS
        SystemLog.log_event(request.user, f"SUCCESS: Added product {serializer.data['name']}", request)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)    
class Productview(APIView):
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.request.method in ['POST', 'DELETE', 'PATCH','GET']:
            # Allows Managers or Superusers
            return [(IsManager | IsSuperAdmin)()] 
        return [IsStaffFromDepartment()] 
    def get(self, request):
        products =Product.objects.all().order_by('name')
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)
    def post(self, request):
        data = request.data.copy()
        
        # ERP Logic: Auto-assign status based on initial stock if not provided
        total_stock = int(data.get('total_stock', 0))
        if total_stock == 0:
            data['status'] = 'OUT_OF_STOCK'
        elif not data.get('status'):
            data['status'] = 'IN_STOCK'

        serializer = ProductSerializer(data=data)
        if serializer.is_valid():
            with transaction.atomic():
                product = serializer.save()
                
                # Create the mandatory StockLog for the first entry
                StockLog.objects.create(
                    product=product,
                    operator=request.user,
                    action_type='ENTRY',
                    quantity_changed=total_stock,
                    resulting_stock=total_stock,
                    reason="Initial system entry"
                )
            
            SystemLog.log_event(request.user, f"Created Product: {product.name}", request)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        try:
            # Select for update locks the row in the DB until the transaction is complete
            with transaction.atomic():
                product = Product.objects.select_for_update().get(pk=pk)
                data = request.data
                user = request.user

                # --- 1. SHIPMENT TRANSACTION LOGIC ---
                if 'quantity_to_ship' in data and int(data['quantity_to_ship']) > 0:
                    qty = int(data['quantity_to_ship'])
                    
                    if product.total_stock < qty:
                        return Response({"error": "INSUFFICIENT_STOCK"}, status=400)

                    # Update stock using F() to ensure accuracy at database level
                    product.total_stock = F('total_stock') - qty
                    product.save()
                    product.refresh_from_db()

                    # Audit Trail for Shipment
                    StockLog.objects.create(
                        product=product,
                        operator=user,
                        action_type='SHIP',
                        quantity_changed=-qty,
                        resulting_stock=product.total_stock,
                        reason=f"Shipment Processed: {data.get('tracking_number', 'N/A')}"
                    )

                # --- 2. AUTOMATIC SYSTEM CHECKS ---
                # Auto-manage status based on stock level
                if product.total_stock <= 0:
                    product.status = 'OUT_OF_STOCK'
                elif product.total_stock <= product.min_stock_level:
                    # You could add a 'LOW_STOCK' status here
                    pass

                # --- 3. METADATA UPDATE ---
                serializer = ProductSerializer(product, data=data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    
                    # Log the generic update event
                    SystemLog.log_event(user, f"UPDATE_COMPLETE: {product.sku}", request)
                    return Response(serializer.data)
                
                return Response(serializer.errors, status=400)

        except Product.DoesNotExist:
            return Response({"error": "RECORD_NOT_FOUND"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    
    def delete(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
            reason = request.query_params.get('reason', 'No reason provided')
        
        # Log the deletion before destroying the object
            SystemLog.log_event(request.user, f"DELETED product: {product.name}. Reason: {reason}")
        
            product.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
class VerificationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FoodVerificationSerializer

    def get_queryset(self):
        return FoodVerification.objects.none()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            active_type = self.request.data.get('active_type')
            if active_type == 'food':
                return FoodVerificationSerializer
            elif active_type == 'electronics':
                return ElectronicsVerificationSerializer
            elif active_type == 'furniture':
                return FurnitureVerificationSerializer
            elif active_type == 'stationery':
                return StationeryVerificationSerializer
        return FoodVerificationSerializer

    def list(self, request, *args, **kwargs):
        food = FoodVerification.objects.all()
        elec = ElectronicsVerification.objects.all()
        furn = FurnitureVerification.objects.all()
        stat = StationeryVerification.objects.all()

        data = {
            "food_verifications": FoodVerificationSerializer(food, many=True).data,
            "electronics_verifications": ElectronicsVerificationSerializer(elec, many=True).data,
            "furniture_verifications": FurnitureVerificationSerializer(furn, many=True).data,
            "stationery_verifications": StationeryVerificationSerializer(stat, many=True).data,
        }
        return Response(data)

    def perform_create(self, serializer):
        assignment_id = self.request.data.get('assignment_id')
        assignment = None

        if assignment_id:
            assignment = OrderAssignment.objects.filter(id=assignment_id).first()

        instance = serializer.save(
            verified_by=self.request.user,
            assignment=assignment
        )

        product = instance.product
        today = timezone.now().date()
        all_checks_passed = True
        auto_comment = ""

        # FOOD
        if isinstance(instance, FoodVerification):
            checks = [
                instance.temp_chain_ok,
                instance.packaging_sealed,
                instance.fssai_verified
            ]
            if product.expiry_date and product.expiry_date < today:
                all_checks_passed = False
                auto_comment = f"FAILED: Product expired on {product.expiry_date}"
            if not all(checks):
                all_checks_passed = False

        # ELECTRONICS
        elif isinstance(instance, ElectronicsVerification):
            checks = [
                instance.boot_test_passed,
                instance.ports_physical_ok
            ]
            if product.warranty_expiry and product.warranty_expiry < today:
                all_checks_passed = False
                auto_comment = f"FAILED: Warranty expired on {product.warranty_expiry}"
            if not all(checks):
                all_checks_passed = False

        # FURNITURE
        elif isinstance(instance, FurnitureVerification):
            checks = [
                instance.structural_ok,
                instance.parts_complete,
                instance.finish_no_scratches
            ]
            if not all(checks):
                all_checks_passed = False
                auto_comment = "FAILED: Furniture QC failed"

        # STATIONERY
        elif isinstance(instance, StationeryVerification):
            checks = [
                instance.quantity_reconciled,
                instance.paper_not_damaged,
                instance.ink_lead_test_passed
            ]
            if not all(checks):
                all_checks_passed = False
                auto_comment = "FAILED: Stationery QC failed"

        # FINAL STATUS CHECK FOR INDIVIDUAL PRODUCT ONLY
        if all_checks_passed:
            instance.is_passed = True
            product.status = 'IN_STOCK'
            # 🚨 FIXED: Removed assignment.process_verification('PASSED') from here!
            # Individual items passing shouldn't mark the whole multi-item order as complete.
        else:
            instance.is_passed = False
            product.status = 'DAMAGED'
            instance.comments = f"{auto_comment} {instance.comments or ''}"

            if assignment:
                # If an item fails, we log it, but don't force break the UI view loop
                pass
            else:
                IssueReport.objects.create(
                    product=product,
                    reported_by=self.request.user,
                    department=product.department,
                    type='DAMAGE',
                    description=instance.comments,
                    urgency='HIGH'
                )

        instance.save()
        product.save()

    # FIXED: Explicitly verify rest_framework decorator registration
    @action(detail=False, methods=['get'], url_path=r'history/(?P<product_id>\d+)')
    def history(self, request, product_id=None):
        assignment_id = request.query_params.get('assignment_id')
        
        verification_history = []
        verification_models = [
            (FoodVerification, FoodVerificationSerializer, "FOOD"),
            (ElectronicsVerification, ElectronicsVerificationSerializer, "ELECTRONICS"),
            (FurnitureVerification, FurnitureVerificationSerializer, "FURNITURE"),
            (StationeryVerification, StationeryVerificationSerializer, "STATIONERY"),
        ]

        for model, serializer_class, category in verification_models:
            queryset = model.objects.filter(product_id=product_id)
            if assignment_id:
                queryset = queryset.filter(assignment_id=assignment_id)
            
            records = queryset.order_by('-timestamp')
            serializer = serializer_class(records, many=True)

            for item in serializer.data:
                item["verification_type"] = category
                verification_history.append(item)

        verification_history = sorted(
            verification_history,
            key=lambda x: x.get("timestamp") or "",
            reverse=True
        )
        return Response(verification_history)
class IssueReportCreateView(generics.CreateAPIView):
    queryset = IssueReport.objects.all()
    serializer_class = IssueReportserializer
    permission_classes = [IsStaffFromDepartment]

    def perform_create(self, serializer):
        # 1. Save the report
        report = serializer.save(
            reported_by=self.request.user,
            department=self.request.user.department
        )

        # 2. FIX: Change 'report.issue_type' to 'report.type'
        Notification.objects.create(
            title="NEW ISSUE REPORTED",
            message=f"Staff {self.request.user.username} reported a {report.type} issue for {report.product.name}.",
            department=self.request.user.department,
            notification_type='ISSUE', # Ensure 'ISSUE' is added to Notification.TYPES if needed
            is_emergency=report.is_emergency 
        )
    
class ManagerIssueListView(generics.ListAPIView):
    serializer_class =IssueReportserializer
    permission_classes =[IsManager]

    def get_queryset(self):
        return IssueReport.objects.filter(
            department =self.request.user.department,
            is_reviewed_by_manager = False
        )

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Sum, F
from app.tasks.models import OrderItem, OrderAssignment

class OrderShippingReviewDetailView(APIView):
   
    permission_classes = [IsAuthenticated]

    def get(self, request, order_number):
        # 1. ഒരേ ഓർഡർ നമ്പറിലുള്ള എല്ലാ ഐറ്റങ്ങളും എടുക്കുന്നു
        order_items = OrderItem.objects.filter(order_number=order_number).select_related('product', 'Customer')

        if not order_items.exists():
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        first_item = order_items.first()
        customer = first_item.Customer

        # 2. TAX & SUB TOTAL CALCULATION (ഡയനാമിക് ആയി കണക്കുകൂട്ടുന്നു)
        subtotal = 0.0
        line_items_data = []

        for item in order_items:
            # പ്രൊഡക്റ്റിന്റെ വില (നിങ്ങളുടെ പ്രൊഡക്റ്റ് മോഡലിൽ price ഫീൽഡ് ഉണ്ടെന്ന് കരുതുന്നു, ഇല്ലെങ്കിൽ 0 വരും)
            price = float(getattr(item.product, 'price', 0.0))
            item_total = item.quantity * price
            subtotal += item_total

            line_items_data.append({
                "item_id": item.id,
                "product_name": item.product.name,
                "sku": item.product.sku,
                "quantity": item.quantity,
                "unit_price": price,
                "line_total": item_total
            })

        tax_rate = 18.0 
        tax_amount = (subtotal * tax_rate) / 100
        shipping_charges = 50.0 
        grand_total = subtotal + tax_amount + shipping_charges

        # 3. PAYMENT & CREDIT TERMS CHECK (അസൈൻമെന്റ് സ്റ്റാറ്റസ് വെച്ച് കണ്ടെത്തുന്നു)
        assignment = OrderAssignment.objects.filter(order=first_item).first()
        
        # ഡിഫോൾട്ട് പേയ്‌മെന്റ് സ്റ്റാറ്റസ്
        payment_status = "CREDIT_HOLD"
        credit_terms = "Net 30 Days Allowed"
        is_clear_for_shipping = False

        if assignment:
            if assignment.verification_status == 'PASSED':
                payment_status = "PAID"
                credit_terms = "Immediate Dispatched"
                is_clear_for_shipping = True
            elif assignment.priority in ['HIGH', 'EMER']:
                # കമ്പനിയുടെ വിശ്വസ്തരായ കസ്റ്റമർമാർക്ക് ക്രെഡിറ്റിൽ സാധനം അയക്കാൻ അനുവദിക്കുന്നു
                payment_status = "APPROVED_ON_CREDIT"
                credit_terms = "Commercial Account Credit"
                is_clear_for_shipping = True

        # 4. FINAL ERP PAYLOAD RESPONSE
        response_data = {
            "order_metadata": {
                "order_number": order_number,
                "status": first_item.get_status_display(),
                "created_at": first_item.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            },
            "customer_details": {
                "name": customer.name if customer else "Unknown Customer",
                "email": customer.email if customer else "N/A",
                "phone": customer.phone if customer else "N/A",
                "tax_number": customer.tax_number if customer and customer.tax_number else "N/A",
                "shipping_address": first_item.order_assignments.first().shipping_address if assignment and assignment.shipping_address else (customer.shipping_address if customer else "No Address Provided")
            },
            "payment_and_credit_details": {
                "payment_status": payment_status,
                "credit_terms": credit_terms,
                "is_clear_for_shipping": is_clear_for_shipping
            },
            "products_ordered": line_items_data,
            "financial_breakdown": {
                "subtotal": subtotal,
                "tax_rate_applied": f"{tax_rate}%",
                "tax_amount": tax_amount,
                "shipping_charges": shipping_charges,
                "grand_total": grand_total
            }
        }

        return Response(response_data, status=status.HTTP_200_OK)
    
class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsStaffFromDepartment] # Or IsManager

    def get_queryset(self):
        # Only show notifications for the user's department
        return Notification.objects.filter(
            department=self.request.user.department,
            is_read=False
        ).order_by('-created_at')

class NotificationMarkReadView(generics.UpdateAPIView):

    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(
            department=self.request.user.department
        )

    def patch(self, request, *args, **kwargs):

        notification = self.get_object()

        notification.is_read = True

        notification.save(
            update_fields=['is_read']
        )

        return Response({
            "id": notification.id,
            "is_read": notification.is_read
        })
    

class ManagerEscalateIssueView(generics.UpdateAPIView):
    queryset = IssueReport.objects.all()
    permission_classes = [IsManager] # Only managers can escalate

    def patch(self, request, pk):
        try:
            # 1. Retrieve the specific report created by staff
            report = self.get_object()
            
            # 2. Capture manager's input from the request
            manager_notes = request.data.get('manager_notes', '')
            
            # 3. Update the report status
            report.is_reviewed_by_manager = True
            report.is_escalated_to_admin = True 
            
            # Save manager's specific remarks (requires adding this field to models.py)
            if hasattr(report, 'manager_remarks'):
                report.manager_remarks = manager_notes
            
            report.save()

            # 4. Trigger a Notification for the System Admin
            Notification.objects.create(
                title="Staff Issue Escalated",
                message=f"Manager {request.user.username} escalated a report: {report.title}. Notes: {manager_notes}",
                notification_type='ESCALATION',
                # Ensure your notification logic can target Admin users
            )
            
            return Response({
                "message": "Report successfully sent to Admin.",
                "report_id": report.id
            }, status=status.HTTP_200_OK)
            
        except IssueReport.DoesNotExist:
            return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)
    

class DepartmentStaffListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsManager]

    def get_queryset(self):
        # This ensures the manager only assigns tasks to their own team
        return User.objects.filter(
            role='staff', 
            department=self.request.user.department
        )

class UnreadNotificationCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            department=request.user.department, 
            is_read=False
        ).count()
        return Response({"unread_count": count})