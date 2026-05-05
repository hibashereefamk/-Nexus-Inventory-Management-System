from collections import defaultdict
from urllib import response
import uuid

from .serilaizers import OrderAssignmentSerializer,UpdateStatusSerializer,DepartmentManagerSerializer,ProductDetailSerializer
from rest_framework import generics
from app.accounts.permissions import IsManager,IsStaffFromDepartment
from django.utils import timezone
from django.db.models import Count
from app.accounts.models import Department
from app.inventory.models import Product, Notification,IssueReport
from app.inventory.seriliazers import ProductSerializer
from django.db.models import Q

from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from django.shortcuts import get_object_or_404
from .models import OrderItem
from .serilaizers import OrderConfirmationSerializer,OrderItemSerializer,AssignOrderSerializer,ManagerDashboardSerializer, UpdateStatusSerializer
from app.accounts.models import User
from app.accounts.serializers import UserWorkloadSerializer
from django.db import models

from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from .models import OrderAssignment
from app.accounts.permissions import IsManager

from rest_framework import generics, permissions
from .models import OrderAssignment
from .serilaizers import OrderAssignmentSerializer # Ensure the spelling matches your file
from app.accounts.permissions import IsManager


class AdminOrderListCreateView(APIView):
    permission_classes = [IsAdminUser]

    from collections import defaultdict

    def get(self, request):
        orders = OrderItem.objects.all().order_by('-id')

        grouped = defaultdict(list)

        for item in orders:
            grouped[item.order_number].append(item)

        response = []

        for order_number, items in grouped.items():
            response.append({
            "order_number": order_number,
            "status": items[0].status,
            "target_department": items[0].target_department.name if items[0].target_department else None,
            "products": [
                {
                    "name": item.product.name,
                    "quantity": item.quantity
                }
                    for item in items
            ]
        })

        return Response(response)

    def post(self, request):
        items = request.data.get('items', [])
        target_department = request.data.get('target_department')

        if not items:
            return Response({"error": "Items required"}, status=400)

        order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"  # ✅ ONE order number

        created_items = []

        for item in items:
            data = {
            "product": item.get("product"),
            "quantity": item.get("quantity"),
            "target_department": target_department,
            "order_number": order_number   # ✅ SAME order number
        }

            serializer = OrderItemSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                created_items.append(serializer.data)
            else:
                return Response(serializer.errors, status=400)

        return Response(created_items, status=201)
            
    
class productListView(generics.ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductDetailSerializer
    permission_classes = [IsAuthenticated]  
class DepartmentListView(generics.ListAPIView):
    """
    Returns a list of all departments with their assigned staff.
    """
    queryset = Department.objects.select_related('manager').all()
    serializer_class = DepartmentManagerSerializer
    permission_classes = [IsAuthenticated]   

class AdmnOrderRejectView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, order_number):
        """
        POST /api/admin-orders/<order_number>/reject/
        """

        orders = OrderItem.objects.filter(order_number=order_number)

        if not orders.exists():
            return Response({
                "error": "Order not found."
            }, status=status.HTTP_404_NOT_FOUND)

        # Check status using first item
        if orders.first().status != 'DRAFT':
            return Response({
                "error": "Only Draft orders can be rejected."
            }, status=status.HTTP_400_BAD_REQUEST)

        rejection_reason = request.data.get("rejection_reason", "").strip()

        if not rejection_reason:
            return Response({
                "error": "Rejection reason is required."
            }, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Update ALL items in that order
        orders.update(
            status='CANCELLED',
            rejection_reason=rejection_reason
        )

        return Response({
            "message": f"Order {order_number} has been rejected.",
            "status": "CANCELLED"
        }, status=status.HTTP_200_OK)
    
class AdminOrderConfirmView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, order_number):
        orders = OrderItem.objects.filter(order_number=order_number)

        if not orders.exists():
            return Response({"error": "Order not found"}, status=404)

        first_order = orders.first()

        if first_order.status != 'DRAFT':
            return Response({"error": "Already processed"}, status=400)

        # ✅ Update ALL items
        orders.update(status='CONFIRMED')

        # ✅ Create ONE assignment
        OrderAssignment.objects.create(
            order=first_order,
            manager=request.user,
            department=first_order.target_department,
            status='PENDING'
        )

        return Response({
            "message": f"{order_number} confirmed",
            "status": "CONFIRMED"
        })

class ManagerAssignmentListView(APIView):
    """
    GET /api/manager-assignments/
    Manager sees all active tasks (grouped by order_number)
    """
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        assignments = OrderAssignment.objects.select_related(
            'order', 'department', 'staff'
        ).filter(
            status__in=['PENDING', 'PACKING']
        ).order_by('-assigned_at')
        
        grouped = defaultdict(list)

        # 🔹 Group assignments by order_number
        for a in assignments:
            grouped[a.order.order_number].append(a)

        response = []

        # 🔹 Build grouped response
        for order_number, group in grouped.items():
            first = group[0]

            items = OrderItem.objects.filter(order_number=order_number)

            response.append({
                "id": first.id,
                "order_number": order_number,
                "department": first.department.name if first.department else None,
                "status": first.status,
                "staff": first.staff.username if first.staff else None,
                "products": [
                    {
                        "name": item.product.name,
                        "quantity": item.quantity
                    }
                    for item in items
                ]
            })

        return Response(response)

def get(self, request):
    assignments = OrderAssignment.objects.select_related('order', 'department', 'staff')\
        .filter(status__in=['PENDING', 'PACKING'])\
        .order_by('-assigned_at')

    grouped = defaultdict(list)

    for a in assignments:
        grouped[a.order.order_number].append(a)

    response = []

    for order_number, group in grouped.items():
        first = group[0]
        items = OrderItem.objects.filter(order_number=order_number)

        response.append({
            "id": first.id,
            "order_number": order_number,
            "department": first.department.name,
            "status": first.status,
            "staff": first.staff.username if first.staff else None,
            "products": [
                {
                    "name": item.product.name,
                    "quantity": item.quantity
                }
                for item in items
            ]
        })

    return Response(response)

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
  

class ManagerStaffFulfillmentView(APIView):
    permission_classes = [IsManager]

    def get(self, request):

        staff_list = User.objects.filter(role='staff').annotate(
            current_tasks=Count(
                'assigned_orders',  # ✅ FIXED (plural)
                filter=Q(assigned_orders__status__in=['PENDING', 'PACKING'])
            )
        ).select_related('warehouse_zone')

        return Response({
            "staff": UserWorkloadSerializer(staff_list, many=True).data
        })
    
class ManagerApproveOrderView(generics.UpdateAPIView):
    queryset = OrderAssignment.objects.all()
    serializer_class = UpdateStatusSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        instance = serializer.save(status='APPROVED')

        # Notify delivery staff
        Notification.objects.create(
            title="Order Approved",
            message=f"Order {instance.order.order_number} is approved for shipping",
            user=instance.staff,
            notification_type='READY_TO_SHIP'
        )
    
class ManagerDashboardStats(APIView):
    permission_classes = [IsAuthenticated,IsManager]

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
            'id', 
            'order__order_number',  # Use double underscore here
            'status', 
            'staff__username'
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
        instance = self.get_object()
        # inspections contains: {"4": {"is_inspected": true}, "5": {"is_inspected": false}}
        inspections = self.request.data.get('inspections', {})
        comments = self.request.data.get('comments', "No specific comments provided.")

        if not instance.order:
            raise ValidationError("Assignment is missing a valid order reference.")

        # 1. Fetch all items belonging to this order
        order_items = OrderItem.objects.filter(order_number=instance.order.order_number)

        any_item_failed = False
        
        for item in order_items:
            p_id = str(item.product.id)
            if p_id in inspections:
                is_passed = inspections[p_id].get('is_inspected', False)
                item.is_inspected = is_passed
                
                # --- ISSUE REPORT LOGIC ---
                # If an item fails, create an official Issue Report automatically
                if not is_passed:
                    any_item_failed = True
                    item.status = 'CANCELLED' # Prevent shipping this item
                    
                    IssueReport.objects.create(
                        product=item.product,
                        reported_by=self.request.user,
                        department=instance.department,
                        type='DAMAGE',
                        description=f"Verification Failed during Packing: {comments}",
                        urgency='HIGH'
                    )
                item.save()

        # 2. Determine Final Assignment Status
        if any_item_failed:
            instance.status = 'DAMAGED'
            
            # Notify Manager about the Damage
            Notification.objects.create(
                title="URGENT: Product Damaged",
                message=f"Order {instance.order.order_number} has failed verification and is marked as DAMAGED.",
                department=instance.department,
                user=instance.manager,
                notification_type='ISSUE',
                is_emergency=True
            )
        else:
            instance.status = 'PACKED'
            
            # --- STOCK REDUCTION LOGIC (Only if everything passed) ---
            for item in order_items:
                product = item.product
                if product.total_stock >= item.quantity:
                    product.total_stock -= item.quantity
                    product.save()
                else:
                    raise ValidationError(f"Insufficient stock for {product.name} at final verification.")

            # Notify Manager that Order is ready for final Approval
            Notification.objects.create(
                title="Order Ready for Approval",
                message=f"Order {instance.order.order_number} is packed and waiting for your approval to ship.",
                department=instance.department,
                user=instance.manager,
                notification_type='APPROVAL_REQUIRED'
            )

        # 3. Finalize and Save the Assignment
        instance.save()
        serializer.save()


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
            "packed": stats_dict.get('PACKED', 0),
            "shipped": stats_dict.get('SHIPPED', 0),
        }
        return Response(response_data)
# Use the serializer created above

class DepartmentListView(generics.ListAPIView):
    """
    Returns a list of all departments with their assigned staff.
    """
    queryset = Department.objects.select_related('manager').all()
    serializer_class = DepartmentManagerSerializer
    permission_classes = [IsAuthenticated]