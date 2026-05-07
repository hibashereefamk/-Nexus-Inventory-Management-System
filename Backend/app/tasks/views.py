from collections import defaultdict
from urllib import response
import uuid
from .serilaizers import OrderAssignmentSerializer,UpdateStatusSerializer,DepartmentManagerSerializer,CategorySerializer,ProductDetailSerializer
from rest_framework import generics
from app.accounts.permissions import IsManager,IsStaffFromDepartment
from django.utils import timezone
from django.db.models import Count
from app.accounts.models import Department
from app.inventory.models import Category, Product, Notification,IssueReport
from app.inventory.seriliazers import ProductSerializer
from django.db.models import Q

from rest_framework.exceptions import ValidationError
from django.db import transaction

from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from django.shortcuts import get_object_or_404
from .models import OrderItem
from .serilaizers import OrderConfirmationSerializer,OrderItemSerializer,AssignOrderSerializer,ManagerDashboardSerializer, UpdateStatusSerializer
from app.accounts.models import User
from app.accounts.serializers import UserWorkloadSerializer


from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from .models import OrderAssignment
from app.accounts.permissions import IsManager

from rest_framework import generics, permissions
from .models import OrderAssignment
from .serilaizers import OrderAssignmentSerializer # Ensure the spelling matches your file
from app.accounts.permissions import IsManager
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from app.inventory.models import IssueReport
from app.tasks.models import OrderItem, OrderAssignment

class AdminResolveIssueView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, report_id):
        """
        Final decision by Admin on an escalated IssueReport.
        """
        report = get_object_or_404(IssueReport, id=report_id)
        decision = request.data.get("decision")  # 'CANCEL' or 'RETRY'
        admin_note = request.data.get("note", "")

        if not decision:
            return Response({"error": "Decision is required."}, status=400)

        assignment = report.assignment
        order = assignment.order

        if decision == 'CANCEL':
            # 1. Update the Order status
            order.status = 'CANCELLED'
            order.rejection_reason = f"Admin Decision: {admin_note}"
            order.save()
            
            # 2. Update the Assignment and Issue Report
            assignment.is_cancelled = True
            assignment.save()
            
            report.is_reviewed_by_manager = True # Admin review counts as final
            report.is_escalated_to_admin = False
            report.manager_remarks = admin_note
            report.save()

        elif decision == 'RETRY':
            # Reset for another attempt (e.g., different staff or stock fixed)
            order.status = 'PROCESSING'
            order.save()
            
            assignment.issue_status = 'NONE'
            assignment.verification_status = 'PENDING'
            assignment.status = 'PENDING'
            assignment.save()
            
            report.is_reviewed_by_manager = True
            report.is_escalated_to_admin = False
            report.save()

        return Response({
            "message": f"Issue resolved as {decision}",
            "order_status": order.status
        })

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
                    "quantity": item.quantity,
                    
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
        Handles rejection for both DRAFT and CONFIRMED orders.
        """
        # Fetch all items associated with this order number
        orders = OrderItem.objects.filter(order_number=order_number)

        if not orders.exists():
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        # Optional: Prevent rejecting orders that are already SHIPPED
        first_item = orders.first()
        if first_item.status in ['SHIPPED', 'CANCELLED']:
            return Response({
                "error": f"Cannot reject an order that is already {first_item.status}."
            }, status=status.HTTP_400_BAD_REQUEST)

        rejection_reason = request.data.get("rejection_reason", "").strip()
        if not rejection_reason:
            return Response({"error": "Rejection reason is required."}, status=status.HTTP_400_BAD_REQUEST)

        # We must loop to ensure stock is released for CONFIRMED items
        for item in orders:
            # If the admin confirms an order, stock gets 'committed'.
            # If they later reject it, we must give that stock back.
            if item.status == 'CONFIRMED' or item.status == 'PROCESSING':
                item.cancel_reservation() 
            
            # Update status and reason
            item.status = 'CANCELLED'
            item.rejection_reason = rejection_reason
            item.save()

        return Response({
            "message": f"Order {order_number} has been rejected and stock reservations released.",
            "status": "CANCELLED"
        }, status=status.HTTP_200_OK)
    
class AdminOrderConfirmView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, order_number):
        orders = OrderItem.objects.filter(order_number=order_number)
        if not orders.exists():
            return Response({"error": "Order not found"}, status=404)

        # 1. Check stock for ALL items in the order first
        for item in orders:
            if item.product.available_stock < item.quantity:
                return Response({
                    "error": f"Insufficient stock for {item.product.name}. Available: {item.product.available_stock}"
                }, status=400)

        # 2. If all items have stock, reserve them
        from django.db import transaction
        with transaction.atomic():
            for item in orders:
                # Reserve the stock (Committed Stock logic)
                item.reserve_stock()
            
            # Update status in bulk to avoid choice validation errors during the "Confirm" phase
            orders.update(status='CONFIRMED')

        # 3. Create the assignment for the warehouse
        first_order = orders.first()
        OrderAssignment.objects.create(
            order=first_order,
            manager=request.user,
            department=first_order.target_department,
            status='PENDING'
        )

        return Response({"message": f"{order_number} confirmed and stock reserved."})
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
            status__in=['PENDING', 'PICKING', 'PACKING', 'PACKED', 'SHIPPED']
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
                "deadline": first.deadline_date if first.deadline_date else None,
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
        assignment = self.get_object()
        decision = self.request.data.get("decision")  # APPROVED / REJECTED
        remarks = self.request.data.get("remarks", "") # Capture manager's note

        # ✅ Call model method with the new remarks argument
        assignment.manager_decision(decision, remarks=remarks)

        # Notify staff
        Notification.objects.create(
            title="Manager Decision",
            message=f"Order {assignment.order.order_number} {decision.lower()}: {remarks}",
            user=assignment.staff,
            notification_type='READY_TO_SHIP' if decision == 'APPROVED' else 'REJECTED'
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
        return OrderAssignment.objects.filter(staff=self.request.user)

    def perform_update(self, serializer):
        assignment = self.get_object()
        new_status = self.request.data.get("status")

    # ✅ Allow normal status updates
        if new_status in ['PENDING', 'PICKING', 'PACKING', 'PACKED']:
            assignment.status = new_status
            assignment.save()

        elif new_status == 'SHIPPED':
            if assignment.approval_status != 'APPROVED':
                raise ValidationError("Manager approval required before shipping")

            assignment.status = 'SHIPPED'
            assignment.completed_at = timezone.now()
            assignment.save()

        assignment.order.update_status_from_assignments()
class StaffTaskDetailView(generics.RetrieveAPIView):
    serializer_class = OrderAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffFromDepartment]

    def get_queryset(self):
        return OrderAssignment.objects.filter(staff=self.request.user)  
    
class StaffCreateIssueView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get("product")
        description = request.data.get("description")
        issue_type = request.data.get("type")

        product = get_object_or_404(Product, id=product_id)

        IssueReport.objects.create(
            product=product,
            reported_by=request.user,
            department=request.user.department,
            type=issue_type,
            description=description,
            urgency="HIGH" if issue_type == "DAMAGE" else "MEDIUM"
        )

        return Response({
            "message": "Issue reported successfully"
        })



class StaffTaskInspectView(generics.UpdateAPIView):
    serializer_class = OrderAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return OrderAssignment.objects.filter(staff=self.request.user)

    def perform_update(self, serializer):
        with transaction.atomic():
            assignment = self.get_object()
            
            # 1. Get data from the flat request structure sent by React
            is_passed = self.request.data.get('is_passed', False)
            comments = self.request.data.get('comments', "")

            # 2. Save the primary assignment data
            serializer.save()

            if not assignment.order:
                raise ValidationError("Missing order reference")

            order_item = assignment.order
            product = order_item.product

            # -------------------------------
            # ✅ TRIGGER MODEL BUSINESS LOGIC
            # -------------------------------
            # This updates verification_status, issue_status, and OrderItem status
            if is_passed:
                assignment.process_verification('PASSED')
            else:
                # If expired or failed, this creates the IssueReport
                assignment.process_verification('FAILED', description=comments)

            # -------------------------------
            # ✅ PRODUCT STOCK & EXPIRY LOGIC
            # -------------------------------
            if is_passed:
                # Basic Stock Check
                if product.total_stock < order_item.quantity:
                    raise ValidationError(f"Insufficient stock for {product.name}")

                # Final Physical Deduction (Only on PASS)
                product.total_stock -= order_item.quantity
                product.save()
            else:
                # If FAILED, we mark the product as DAMAGED in the inventory
                product.status = 'DAMAGED'
                product.save()

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

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]  