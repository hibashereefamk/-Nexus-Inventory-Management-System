from rest_framework import generics, permissions
from rest_framework.views import APIView
from .models import Product,IssueReport,Notification, StockLog
from rest_framework.response import Response
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
from datetime import datetime
from django.db import models

from rest_framework import generics
from app.accounts.models import User
from app.accounts.serializers import UserSerializer # Ensure you have a basic UserSerializer
from app.accounts.permissions import IsManager,IsSuperAdmin

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
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
    
    # CRITICAL: Define a default serializer class so DRF doesn't crash
    serializer_class = FoodVerificationSerializer 

    def get_serializer_class(self):
    # Check if we are in a POST request
        if self.request.method == 'POST':
        # Priority 1: Use the 'active_type' sent from frontend
            active_type = self.request.data.get('active_type')
        
            if active_type == 'food':
                return FoodVerificationSerializer
            elif active_type == 'electronics':
                return ElectronicsVerificationSerializer
            elif active_type == 'furniture':
                return FurnitureVerificationSerializer
            elif active_type == 'stationery':
                return StationeryVerificationSerializer

    # Priority 2: Fallback to product department if type not provided
        product_id = self.request.data.get('product')
        if product_id:
            try:
                product = Product.objects.get(id=product_id)
                dept = product.department.slug.lower()
                if 'food' in dept: return FoodVerificationSerializer
                if 'electronics' in dept: return ElectronicsVerificationSerializer
                if 'furniture' in dept: return FurnitureVerificationSerializer
                if 'stationery' in dept: return StationeryVerificationSerializer
            except Product.DoesNotExist:
                self.response = Response({"error": "Invalid product ID"}, status=status.HTTP_400_BAD_REQUEST)

        return super().get_serializer_class()
        

    def perform_create(self, serializer):
        # 1. Save the verification record
        # Note: Serializer already knows if it's Food, Electronics, etc.
        instance = serializer.save(verified_by=self.request.user)
        product = instance.product

        # 2. Dynamic Field Check
        # We check all boolean fields of the specific instance (Food, Furniture, etc.)
        # exclude metadata fields like 'is_passed' or 'id'
        excluded_fields = {'id', 'is_passed', 'timestamp', 'product_id', 'verified_by_id', 'comments', 'batch_lot', 'unique_serial_number', 'firmware_version'}
        
        # Get all boolean fields for this specific verification type
        all_checks_passed = True
        for field in instance._meta.fields:
            if field.name not in excluded_fields and isinstance(field, models.BooleanField):
                if getattr(instance, field.name) is False:
                    all_checks_passed = False
                    break

        # 3. Apply your Logic
        if all_checks_passed:
            product.status = 'IN_STOCK' # Or 'VERIFIED' if you add that choice
            instance.is_passed = True
            
            # Update Batch Number if it's a Food item
            if hasattr(instance, 'batch_lot'):
                product.batch_number = instance.batch_lot
                
            # If you have an Order model linked to product, update it here:
            # if hasattr(product, 'order'):
            #     product.order.status = 'PACKED'
            #     product.order.save()
        else:
            product.status = 'DAMAGED'
            instance.is_passed = False
            
            # 4. Create Automatic Issue Report
            IssueReport.objects.create(
                product=product,
                reported_by=self.request.user,
                department=product.department,
                type='DAMAGE', # Maps to your IssueReport.type choices
                urgency='HIGH',
                description=f"AUTO-GEN: {instance.__class__.__name__} failed. {instance.comments or 'No comments provided.'}"
            )

            # 5. Create Notification
            Notification.objects.create(
                title="Verification Failed",
                message=f"Product {product.name} failed quality check and is marked as DAMAGED.",
                department=product.department,
                notification_type='ISSUE',
                product=product,
                is_emergency=True
            )

        # Final saves
        instance.save()
        product.save()
        
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
    
    
class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsStaffFromDepartment] # Or IsManager

    def get_queryset(self):
        # Only show notifications for the user's department
        return Notification.objects.filter(
            department=self.request.user.department,
            is_read=False
        ).order_by('-created_at')
    

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