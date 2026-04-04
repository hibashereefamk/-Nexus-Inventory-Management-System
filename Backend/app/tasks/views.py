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
        # Automatically assign the manager and the staff's department
        staff_user = serializer.validated_data.get('staff')
        serializer.save(
            manager=self.request.user,
            department=staff_user.department if staff_user else None
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
        # Ensure staff can only update their own assigned tasks
        return OrderAssignment.objects.filter(staff=self.request.user)

    def perform_update(self, serializer):
        # 1. Get the new status from the request data
        new_status = self.request.data.get("status")
        
        # 2. Save the instance with the new status
        instance = serializer.save(status=new_status)
        
        # 3. Trigger notification ONLY if it was marked as SHIPPED
        if new_status == 'SHIPPED':
            Notification.objects.create(
                title="Shipment Complete",
                message=f"Order {instance.order_number} has been shipped by staff.",
                user=instance.manager,  # Notify the manager who assigned it
                notification_type='TASK_COMPLETE'
            )

class StaffTaskDetailView(generics.RetrieveAPIView):
    serializer_class = OrderAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffFromDepartment]

    def get_queryset(self):
        return OrderAssignment.objects.filter(staff=self.request.user)  
    


class StaffTaskInspectView(generics.UpdateAPIView):
    serializer_class = OrderAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only allow staff to see tasks assigned to them
        return OrderAssignment.objects.filter(staff=self.request.user)

    def perform_update(self, serializer):
        # 1. Retrieve the instance being updated
        instance = self.get_object()
        
        # 2. Extract the 'inspections' dictionary from the request body
        # React sends: { "inspections": { "1": { "is_inspected": true } } }
        inspections = self.request.data.get('inspections', {})

        # 3. Update the OrderItems using the related_name 'items'
        # This matches the 'items' field in your new Serializer
        order_items = instance.items.all()
        
        for item in order_items:
            product_id = str(item.product.id)
            if product_id in inspections:
                # Update the database field based on the frontend toggle
                item.is_inspected = inspections[product_id].get('is_inspected', item.is_inspected)
                item.save()

        # 4. Optional Logic: Auto-update status if all items are checked
        all_done = not order_items.filter(is_inspected=False).exists()
        if all_done:
            instance.status = 'PACKED'
            # No need to manually save instance here, serializer.save() below handles it
        
        # 5. Save the main OrderAssignment (triggers any signals/notifications)
        serializer.save()

    def patch(self, request, *args, **kwargs):
        # We override patch to return a custom success message
        response = super().patch(request, *args, **kwargs)
        return Response({
            "status": "success",
            "message": "Inspection records synchronized.",
            "updated_order": response.data
        }, status=status.HTTP_200_OK)


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