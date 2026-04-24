from rest_framework import generics, permissions
from rest_framework.views import APIView
from .models import Product,IssueReport,Notification
from rest_framework.response import Response
from rest_framework import status
from app.accounts.permissions import IsManager,IsStaffFromDepartment,IsSuperAdmin
from .seriliazers import ProductSerializer,CategorySerializer,NotificationSerializer,IssueReportserializer
from app.accounts.models import  SystemLog

from rest_framework.permissions import IsAuthenticated
from django.db.models import F
from django.db import transaction
from django.utils import timezone
from datetime import datetime

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
        products = Product.objects.all()
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy() # Make a mutable copy of the data
        
        # 1. FIX: Missing reorder_level for Office Items
        # If category is Office and reorder_level isn't provided, set a default
        if data.get('category') == "Office" and not data.get('reorder_level'):
            data['reorder_level'] = 5  # Default level to pass model validation

        # 2. FIX: Convert empty strings to None for DateFields
        for field in ['expiry_date', 'warranty_expiry', 'manager_deadline']:
            if data.get(field) == "":
                data[field] = None

        serializer = ProductSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
        
        data = request.data.copy()
        new_status = data.get('status')
        user = request.user

        # 1. Security Check
        if new_status == 'SHIPPED' and not (user.is_superuser or user.is_management):
            return Response({"error": "Staff cannot ship. Manager approval required."}, 
                            status=status.HTTP_403_FORBIDDEN)

        # 2. Date Conversion & Overdue Logic (Fixes the TypeError)
        deadline_raw = data.get('manager_deadline')
        if deadline_raw and isinstance(deadline_raw, str):
            try:
                # Convert string from React to Python date object
                deadline = datetime.strptime(deadline_raw, '%Y-%m-%d').date()
            except ValueError:
                return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=400)
        else:
            deadline = product.manager_deadline

        # Compare date objects
        if deadline and timezone.now().date() > deadline:
            product.is_overdue = True
        else:
            product.is_overdue = False

        # 3. Status Logic
        if new_status == 'PACKED':
            product.assigned_at = timezone.now()
    
        if new_status == 'FLAGGED':
            if not data.get('damage_notes'):
                return Response({"error": "You must provide damage notes to flag an item."}, 
                                status=status.HTTP_400_BAD_REQUEST)
            
            # Auto-create notification for flagged items
            Notification.objects.create(
                title="Damage Reported",
                message=f"Staff reported damage on {product.name}: {data.get('damage_notes')}",
                department=product.department,
                notification_type='DAMAGE'
            )
    
        # 4. Stock deduction on ship (Atomic)
        if new_status == 'SHIPPED':
            quantity_to_ship = int(data.get('quantity_to_ship', 1))
            if product.total_stock < quantity_to_ship:
                return Response({"error": f"Insufficient stock. Available: {product.total_stock}"}, 
                                status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                # Use F() expressions to prevent race conditions
                product.total_stock = F('total_stock') - quantity_to_ship
                product.shipped_date = timezone.now()
                product.save()
                # We need to refresh from DB because F() expressions make the field a dynamic expression
                product.refresh_from_db()

        # 5. Final serialization and save
        serializer = ProductSerializer(product, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
    
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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

    # ... (rest of your status and stock logic) ...
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
    """
    Returns a list of staff members who belong to the same 
    department as the requesting manager.
    """
    serializer_class = UserSerializer
    permission_classes = [IsManager]

    def get_queryset(self):
        # Filter users where role is 'staff' and department matches the manager's
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