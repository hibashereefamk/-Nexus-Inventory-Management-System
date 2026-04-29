from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from django.shortcuts import get_object_or_404

from django.db import models
from .models import OrderItem
from .serilaizers import OrderConfirmationSerializer,OrderItemSerializer,AssignOrderSerializer,ManagerDashboardSerializer, UpdateStatusSerializer
from app.accounts.models import User
from app.accounts.serializers import UserWorkloadSerializer

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from .models import OrderAssignment
from app.accounts.permissions import IsManager



class AdminOrderListCreateView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        """
        GET /api/admin-orders/
        """
        orders = OrderItem.objects.all().order_by('-id')
        serializer = OrderItemSerializer(orders, many=True)
        return Response(serializer.data)

    def post(self, request):
        """
        POST /api/admin-orders/
        """
        serializer = OrderItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AdminOrderConfirmView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        """
        POST /api/admin-orders/<id>/confirm/
        """
        order = get_object_or_404(OrderItem, pk=pk)

        serializer = OrderConfirmationSerializer(
            order,
            data=request.data,
            context={'request': request},
            partial=True
        )

        if serializer.is_valid():
            serializer.save()

            return Response({
                "message": f"Order {order.order_number} confirmed and sent to manager queue.",
                "status": "CONFIRMED"
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ManagerAssignmentListView(APIView):
    """
    GET /api/manager-assignments/
    Manager sees all active tasks (PENDING, PACKING)
    """
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        assignments = OrderAssignment.objects.select_related(
            'order', 'department', 'staff'
        ).filter(status__in=['PENDING', 'PACKING']).order_by('-assigned_at')

        serializer = ManagerDashboardSerializer(assignments, many=True)
        return Response(serializer.data)




class ManagerAssignStaffView(APIView):
    """
    POST /api/manager-assignments/<id>/assign-staff/
    """
    permission_classes = [IsAuthenticated, IsManager]

    def post(self, request, pk):
        assignment = get_object_or_404(OrderAssignment, pk=pk)

        serializer = AssignOrderSerializer(
            assignment,
            data=request.data,
            context={'request': request},
            partial=True
        )

        if serializer.is_valid():
            serializer.save()

            return Response({
                "message": f"Task assigned to {assignment.staff.username}",
                "staff": assignment.staff.username
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class StaffTaskListView(APIView):
    """
    GET /api/staff/tasks/
    Staff sees only tasks assigned to them by the Manager.
    """
    permission_classes = [IsAuthenticated] # You can add IsStaff permission here

    def get(self, request):
        assignments = OrderAssignment.objects.filter(staff=request.user).order_by('deadline_date')
        serializer = ManagerDashboardSerializer(assignments, many=True)
        return Response(serializer.data)

class StaffUpdateStatusView(APIView):
    """
    PATCH /api/staff/tasks/<id>/update-status/
    Staff updates status (e.g., PACKING -> PACKED).
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        assignment = get_object_or_404(OrderAssignment, pk=pk, staff=request.user)
        serializer = UpdateStatusSerializer(assignment, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response({"status": "Status updated successfully"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class ManagerDashboardStats(APIView):
    """
    GET /api/manager/stats/
    Provides the 'Big Picture' for the manager across all departments.
    """
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        from django.utils import timezone
        
        stats = {
            "total_pending": OrderAssignment.objects.filter(status='PENDING').count(),
            "active_packing": OrderAssignment.objects.filter(status='PACKING').count(),
            "overdue": OrderAssignment.objects.filter(
                status__in=['PENDING', 'PACKING'],
                deadline_date__lt=timezone.now().date()
            ).count(),
        }
        
        # Staff count per department for the chart
        staff_per_dept = User.objects.filter(role='staff')\
            .values('department__name')\
            .annotate(count=models.Count('id'))

        return Response({
            "stats": stats,
            "staff_distribution": list(staff_per_dept)
        })
class ManagerStaffWorkloadView(APIView):
    """
    GET /api/manager/staff-availability/
    Helps manager see which staff has the least tasks before assigning.
    """
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        from django.db.models import Q, Count
        
        staff_list = User.objects.filter(role='staff').annotate(
            active_tasks=Count(
                'order_assignments', 
                filter=Q(status__in=['PENDING', 'PACKING'])
            )
        )
        # Use your UserWorkloadSerializer here
        serializer = UserWorkloadSerializer(staff_list, many=True)
        return Response(serializer.data)

    



























# from django.shortcuts import render
# from .serilaizers import OrderAssignmentSerializer,UpdateStatusSerializer,DepartmentManagerSerializer
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status,generics,permissions
# from app.accounts.permissions import IsManager,IsStaffFromDepartment
# from .models import OrderAssignment,OrderItem
# from django.utils import timezone
# from rest_framework.permissions import IsAuthenticated
# from django.db.models import Count
# from app.accounts.models import User,Department
# from app.accounts.serializers import UserWorkloadSerializer
# from app.inventory.models import Product, Notification
# from app.inventory.seriliazers import ProductSerializer
# from django.db.models import Q
# from django.db import transaction
# from django.core.exceptions import ValidationError
# from app.accounts.models import SystemLog
# from django.shortcuts import get_object_or_404
# from rest_framework import serializers

# class ManagerCreateOrderView(generics.CreateAPIView):
#     """
#     Creates an OrderAssignment with items (NO staff assignment here).
#     """
#     serializer_class = OrderAssignmentSerializer
#     permission_classes = [permissions.IsAuthenticated, IsManager]

#     def perform_create(self, serializer):
#         items_data = self.request.data.get('items', [])

#         if not items_data:
#             raise ValidationError("An order must have at least one product item.")

#         with transaction.atomic():

#             # ✅ Create order WITHOUT staff
#             assignment = serializer.save(
#                 manager=self.request.user,
#                 department=self.request.user.department,
#                 staff=None,              # explicitly no assignment
#                 status='PENDING'         # initial status
#             )

#             # ✅ Create items
#             for item in items_data:
#                 product = get_object_or_404(Product, id=item['product'])
#                 quantity = int(item['quantity'])

#                 # Stock validation
#                 if product.total_stock < quantity:
#                     raise ValidationError(
#                         f"Insufficient stock for {product.name}."
#                     )

#                 # Reduce stock
#                 product.total_stock -= quantity
#                 product.save()

#                 # Create order item
#                 OrderItem.objects.create(
#                     assignment=assignment,
#                     product=product,
#                     quantity=quantity
#                 )

#             # ✅ Logging
#             SystemLog.log_event(
#                 user=self.request.user,
#                 action=f"Order {assignment.order_number} created with {len(items_data)} items.",
#                 request=self.request
#             )


# class AssignOrderSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = OrderAssignment
#         fields = ['staff']

#     def validate(self, data):
#         request = self.context['request']
#         staff = data.get('staff')
#         order = self.instance

#         # ✅ Must provide staff
#         if not staff:
#             raise ValidationError("Staff is required.")

#         # ✅ Department check
#         if staff.department != request.user.department:
#             raise ValidationError("Staff must belong to your department.")

#         # ✅ Prevent reassign if already assigned (optional)
#         if order.staff:
#             raise ValidationError("Order already assigned.")

#         return data
  

# class ManagerStaffFulfillmentView(APIView):
#     """
#     Returns data needed for the advanced assignment modal, 
#     including workload heatmaps and auto-suggestions.
#     """
#     permission_classes = [IsManager]

#     def get(self, request):
#         # We need to list all staff but annotate them with their workload status
#         # for the heat map in the React form.
#         staff_list = User.objects.filter(role='staff').annotate(
#             current_tasks=Count(
#                 'assigned_orders',
#                 filter=Q(status__in=['PENDING', 'PACKING'])
#             )
#         ).select_related('warehouse_zone')

#         # We also need to add FEFO logic for Food items
#         products = Product.objects.all().order_by('expiry_date')

#         return Response({
#             "staff": UserWorkloadSerializer(staff_list, many=True).data,
#             "products": ProductSerializer(products, many=True).data,
#         })
# class ManagerDashboardStats(APIView):
#     permission_classes = [IsAuthenticated, IsManager]

#     def get(self, request):
#         user = request.user
        
#         # 1. Define the filter (using an empty Q object to see everything)
#         filter_q = Q() 

#         # 2. Get staff count grouped by department
#         staff_per_dept = User.objects.filter(role='staff')\
#             .values('department__name')\
#             .annotate(count=Count('id'))\
#             .order_by('department__name')

#         # 3. Calculate general stats
#         stats = {
#             "total_staff": User.objects.filter(role='staff').count(),
#             "active_tasks": OrderAssignment.objects.filter(status='PACKING').count(),
#             "completed_shipments": OrderAssignment.objects.filter(status__in=['PACKED', 'SHIPPED']).count(),
#             "overdue": OrderAssignment.objects.filter(
#                 status__in=['PENDING', 'PACKING'],
#                 deadline_date__lt=timezone.now().date()
#             ).count(),
#         }

#         # 4. Get recent tasks
#         recent_tasks = OrderAssignment.objects.filter(filter_q).order_by('-assigned_at')[:5].values(
#             'id', 'order_number', 'status', 'staff__username'
#         )

#         # 5. Generate Alerts
#         low_stock_products = Product.objects.filter(filter_q)
#         alerts = [
#             {"id": f"stock_{p.id}", "message": f"Low Stock: {p.name} ({p.total_stock} left)"}
#             for p in low_stock_products if p.is_low_stock
#         ]

#         # 6. CRITICAL FIX: Ensure you actually RETURN the Response object
#         return Response({
#             "stats": stats,
#             "staff_per_dept": list(staff_per_dept),
#             "recent_tasks": list(recent_tasks),
#             "alerts": alerts
#         })
# from rest_framework import generics, permissions
# from .models import OrderAssignment
# from .serilaizers import OrderAssignmentSerializer # Ensure the spelling matches your file
# from app.accounts.permissions import IsManager

# class ManagerTaskListView(generics.ListAPIView):
#     """
#     API endpoint for the Manager to see all tasks 
#     across all departments for the Task Registry.
#     """
#     serializer_class = OrderAssignmentSerializer
#     permission_classes = [permissions.IsAuthenticated, IsManager]

#     def get_queryset(self):
#         # Returns all tasks, ordered by the most recently assigned
#         return OrderAssignment.objects.all().order_by('-assigned_at')
    

# class StaffDashboardTasksView(generics.ListAPIView):
#     serializer_class = OrderAssignmentSerializer
#     permission_classes = [permissions.IsAuthenticated, IsStaffFromDepartment]

#     def get_queryset(self):
#         return OrderAssignment.objects.filter(
#             staff=self.request.user
#         ).order_by('status', 'deadline_date')


# class StaffUpdateTaskStatusView(generics.UpdateAPIView):
#     serializer_class = UpdateStatusSerializer
#     permission_classes = [permissions.IsAuthenticated, IsStaffFromDepartment]

#     def get_queryset(self):
#         # Ensure staff can only update their own assigned tasks
#         return OrderAssignment.objects.filter(staff=self.request.user)

#     def perform_update(self, serializer):
#         # 1. Get the new status from the request data
#         new_status = self.request.data.get("status")
        
#         # 2. Save the instance with the new status
#         instance = serializer.save(status=new_status)
        
#         # 3. Trigger notification ONLY if it was marked as SHIPPED
#         if new_status == 'SHIPPED':
#             Notification.objects.create(
#                 title="Shipment Complete",
#                 message=f"Order {instance.order_number} has been shipped by staff.",
#                 user=instance.manager,  # Notify the manager who assigned it
#                 notification_type='TASK_COMPLETE'
#             )

# class StaffTaskDetailView(generics.RetrieveAPIView):
#     serializer_class = OrderAssignmentSerializer
#     permission_classes = [permissions.IsAuthenticated, IsStaffFromDepartment]

#     def get_queryset(self):
#         return OrderAssignment.objects.filter(staff=self.request.user)  
    


# class StaffTaskInspectView(generics.UpdateAPIView):
#     serializer_class = OrderAssignmentSerializer
#     permission_classes = [permissions.IsAuthenticated]

#     def get_queryset(self):
#         # Only allow staff to see tasks assigned to them
#         return OrderAssignment.objects.filter(staff=self.request.user)

#     def perform_update(self, serializer):
#         # 1. Retrieve the instance being updated
#         instance = self.get_object()
        
#         # 2. Extract the 'inspections' dictionary from the request body
#         # React sends: { "inspections": { "1": { "is_inspected": true } } }
#         inspections = self.request.data.get('inspections', {})

#         # 3. Update the OrderItems using the related_name 'items'
#         # This matches the 'items' field in your new Serializer
#         order_items = instance.items.all()
        
#         for item in order_items:
#             product_id = str(item.product.id)
#             if product_id in inspections:
#                 # Update the database field based on the frontend toggle
#                 item.is_inspected = inspections[product_id].get('is_inspected', item.is_inspected)
#                 item.save()

#         # 4. Optional Logic: Auto-update status if all items are checked
#         all_done = not order_items.filter(is_inspected=False).exists()
#         if all_done:
#             instance.status = 'PACKED'
#             # No need to manually save instance here, serializer.save() below handles it
        
#         # 5. Save the main OrderAssignment (triggers any signals/notifications)
#         serializer.save()

#     def patch(self, request, *args, **kwargs):
#         # We override patch to return a custom success message
#         response = super().patch(request, *args, **kwargs)
#         return Response({
#             "status": "success",
#             "message": "Inspection records synchronized.",
#             "updated_order": response.data
#         }, status=status.HTTP_200_OK)


# class TaskStatsView(APIView):
#     permission_classes = [permissions.IsAuthenticated]

#     def get(self, request):
#         # Filter stats specifically for the logged-in staff member
#         stats = OrderAssignment.objects.filter(staff=request.user).values('status').annotate(total=Count('id'))
        
#         # Format the response into a clean dictionary
#         stats_dict = {item['status']: item['total'] for item in stats}
        
#         # Ensure all keys exist even if count is 0
#         response_data = {
#             "total_assigned": sum(stats_dict.values()),
#             "pending": stats_dict.get('PENDING', 0),
#             "packing": stats_dict.get('PACKING', 0),
#             "shipped": stats_dict.get('SHIPPED', 0),
#         }
#         return Response(response_data)
# # Use the serializer created above

# class DepartmentListView(generics.ListAPIView):
#     """
#     Returns a list of all departments with their assigned staff.
#     """
#     queryset = Department.objects.select_related('manager').all()
#     serializer_class = DepartmentManagerSerializer
#     permission_classes = [IsAuthenticated]