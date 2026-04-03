from rest_framework import generics, permissions
from rest_framework.views import APIView
from .models import Product,IssueReport,Notification
from rest_framework.response import Response
from rest_framework import status
from app.accounts.permissions import IsManager,IsStaffFromDepartment,IsSuperAdmin
from .seriliazers import ProductSerializer,CategorySerializer,NotificationSerializer,IssueReportserializer
    
from django.db.models import F
from django.db import transaction
from django.utils import timezone

from rest_framework import generics
from app.accounts.models import User
from app.accounts.serializers import UserSerializer # Ensure you have a basic UserSerializer
from app.accounts.permissions import IsManager

    
class Productview(APIView):
    serializer_class = ProductSerializer
    def get_permissions(self):
        if self.request.method in ['POST', 'DELETE']:
            return [IsManager()] # Added brackets ()
        return [IsStaffFromDepartment()] 

    def get(self, request, pk=None):
        is_overdue = request.query_params.get('overdue')
        if is_overdue:
            products = Product.objects.filter(due_date__lt=timezone.now(), status='PENDING')
        else:
            products = Product.objects.all()
            
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        serializer = ProductSerializer(data=request.data)
        if serializer.data.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    def patch(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
    
        data = request.data
        new_status = data.get('status')
        user = request.user

    # 1. SECURITY: Only Managers can finalize 'SHIPPED'
        if new_status == 'SHIPPED' and not user.groups.filter(name='Manager').exists():
            return Response({"error": "Staff cannot ship. Manager approval required."}, 
                        status=status.HTTP_403_FORBIDDEN)

    # 2. LOGIC: Handle Status Transitions
        if new_status == 'PACKED':
            product.assigned_at = timezone.now()
    
        if new_status == 'FLAGGED':
            if not data.get('damage_notes'):
                return Response({"error": "You must provide damage notes to flag an item."}, 
                                status=status.HTTP_400_BAD_REQUEST)
            
            # ADD THIS: Create a real notification for the Manager
            Notification.objects.create(
                title="Damage Reported",
                message=f"Staff reported damage on {product.name}: {data.get('damage_notes')}",
                department=product.department,
                notification_type='DAMAGE'
            )
    
    # 3. STOCK & TRANSACTION: Ensure stock is deducted safely
        if new_status == 'SHIPPED':
            quantity_to_ship = int(data.get('quantity_to_ship', 1)) # Default to 1 if not provided
        
            if product.total_stock < quantity_to_ship:
                return Response({"error": f"Insufficient stock. Available: {product.total_stock}"}, 
                            status=status.HTTP_400_BAD_REQUEST)

        # Use a transaction to ensure database integrity
            with transaction.atomic():
                product.total_stock = F('total_stock') - quantity_to_ship
                product.shipped_date = timezone.now()
                product.save()

    # 4. OVERDUE CHECK: Logic for your (26-alert, 27-monitor) requirement
        if product.due_date and timezone.now() > product.due_date:
            product.is_overdue = True # Assuming you have this field

        serializer = ProductSerializer(product, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
    
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class IssueReportCreateView(generics.CreateAPIView):
    queryset =IssueReport.objects.all()
    serializer_class =IssueReportserializer
    permission_classes =[IsStaffFromDepartment]

    def perform_create(self, serializer):
        serializer.save(
            reported_by = self.request.user,
            department = self.request.user.department
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