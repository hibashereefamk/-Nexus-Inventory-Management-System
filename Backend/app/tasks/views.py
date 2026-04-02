from django.shortcuts import render
from .serilaizers import OrderAssignmentSerializer,UpdateStatusSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status,generics,permissions
from app.accounts.permissions import IsManager,IsStaffFromDepartment
from .models import OrderAssignment,OrderItem
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from app.accounts.models import User
from app.inventory.models import Product, Notification
from django.db.models import Q

class ManagerCreateAssignmentView(generics.CreateAPIView):
    serializer_class = OrderAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsManager]

    def perform_create(self, serializer):
        staff = serializer.validated_data.get('staff')

        serializer.save(
            manager=self.request.user,
            department=staff.department
        )

class ManagerDashboardStats(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        user = request.user
        
        # 1. Define the filter (using an empty Q object to see everything)
        filter_q = Q() 

        # 2. Get staff count grouped by department
        staff_per_dept = User.objects.filter(role='staff')\
            .values('department__name')\
            .annotate(count=Count('id'))\
            .order_by('department__name')

        # 3. Calculate general stats
        stats = {
            "total_staff": User.objects.filter(role='staff').count(),
            "active_tasks": OrderAssignment.objects.filter(status='PACKING').count(),
            "completed_shipments": OrderAssignment.objects.filter(status__in=['PACKED', 'SHIPPED']).count(),
            "overdue": OrderAssignment.objects.filter(
                status__in=['PENDING', 'PACKING'],
                deadline_date__lt=timezone.now().date()
            ).count(),
        }

        # 4. Get recent tasks
        recent_tasks = OrderAssignment.objects.filter(filter_q).order_by('-assigned_at')[:5].values(
            'id', 'order_number', 'status', 'staff__username'
        )

        # 5. Generate Alerts
        low_stock_products = Product.objects.filter(filter_q)
        alerts = [
            {"id": f"stock_{p.id}", "message": f"Low Stock: {p.name} ({p.total_stock} left)"}
            for p in low_stock_products if p.is_low_stock
        ]

        # 6. CRITICAL FIX: Ensure you actually RETURN the Response object
        return Response({
            "stats": stats,
            "staff_per_dept": list(staff_per_dept),
            "recent_tasks": list(recent_tasks),
            "alerts": alerts
        })

class StaffDashboardTasksView(generics.ListAPIView):
    serializer_class = OrderAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffFromDepartment]

    def get_queryset(self):
        return OrderAssignment.objects.filter(
            staff=self.request.user
        ).order_by('status', 'deadline_date')


class StaffUpdateTaskStatusView(generics.UpdateAPIView):
    serializer_class = UpdateStatusSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffFromDepartment]

    def get_queryset(self):
        return OrderAssignment.objects.filter(staff=self.request.user)

    def perform_update(self, serializer):
        status_value = self.request.data.get("status")

        if status_value == "SHIPPED":
            serializer.save(
                status=status_value,
                completed_at=timezone.now()
            )
        else:
            serializer.save(status=status_value)

class StaffTaskDetailView(generics.RetrieveAPIView):
    serializer_class = OrderAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffFromDepartment]

    def get_queryset(self):
        return OrderAssignment.objects.filter(staff=self.request.user)  
    
class StaffTaskInspectView(generics.UpdateAPIView):
    serializer_class = OrderAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffFromDepartment]

    def get_queryset(self):
        return OrderAssignment.objects.filter(staff=self.request.user)

    def perform_update(self, serializer):
        order_assignment = self.get_object()
    
        inspections = self.request.data.get('inspections', {})
    
   
        order_assignment.status = 'INSPECTED'
        order_assignment.save()

    # Logic to update individual items based on the frontend data
        order_items = OrderItem.objects.filter(order=order_assignment.order)
        for item in order_items:
            product_id = str(item.product.id)
            if product_id in inspections:
                item_data = inspections[product_id]
                item.is_inspected = True
            # Update item based on frontend: item_data['status'], item_data['verified_qty']
                item.save()

        serializer.save() 


from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from .models import OrderAssignment

class TaskStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Filter stats specifically for the logged-in staff member
        stats = OrderAssignment.objects.filter(staff=request.user).values('status').annotate(total=Count('id'))
        
        # Format the response into a clean dictionary
        stats_dict = {item['status']: item['total'] for item in stats}
        
        # Ensure all keys exist even if count is 0
        response_data = {
            "total_assigned": sum(stats_dict.values()),
            "pending": stats_dict.get('PENDING', 0),
            "packing": stats_dict.get('PACKING', 0),
            "shipped": stats_dict.get('SHIPPED', 0),
        }
        return Response(response_data)