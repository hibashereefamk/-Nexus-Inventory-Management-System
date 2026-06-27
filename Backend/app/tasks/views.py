from collections import defaultdict
import uuid
from .serilaizers import OrderAssignmentSerializer,UpdateStatusSerializer,DepartmentManagerSerializer,CategorySerializer,ProductDetailSerializer,ManagerDashboardSerializer
from rest_framework import generics
from app.accounts.permissions import IsManager,IsStaffFromDepartment
from django.utils import timezone
from django.db.models import Count
from app.accounts.models import Department
from app.inventory.models import Category, Product, Notification,IssueReport
from app.inventory.seriliazers import ProductSerializer
from django.db.models import Q,F
from app.tasks.serilaizers import CustomerSerializer

from rest_framework.exceptions import ValidationError
from django.db import transaction

from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from django.shortcuts import get_object_or_404
from .models import Customer, OrderItem
from .serilaizers import OrderConfirmationSerializer,OrderItemSerializer,AssignOrderSerializer,ManagerDashboardSerializer, UpdateStatusSerializer
from app.accounts.models import User
from app.accounts.serializers import UserWorkloadSerializer


from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from .models import OrderAssignment
from app.accounts.permissions import IsManager
from .models import RestockRequest
from rest_framework import generics, permissions
from .serilaizers import OrderAssignmentSerializer # Ensure the spelling matches your file
from app.accounts.permissions import IsManager
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from app.inventory.models import IssueReport
from app.tasks.models import OrderItem, OrderAssignment,Customer

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

class CustomerListCreateView(APIView):
   
    permission_classes = [IsAuthenticated]

    def get(self, request):
        customers = Customer.objects.all().order_by('name')
        serializer = CustomerSerializer(customers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CustomerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AdminOrderListCreateView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        orders = OrderItem.objects.all().order_by('-id')
        grouped = defaultdict(list)
        for item in orders:
            grouped[item.order_number].append(item)

        response = []
        for order_number, items in grouped.items():
            # കസ്റ്റമർ വിവരങ്ങൾ ഉണ്ടെങ്കിൽ ഫ്രണ്ട്-എൻഡിലേക്ക് അയക്കുന്നു
            customer_obj = items[0].Customer
            response.append({
                "order_number": order_number,
                "status": items[0].status,
                "target_department": items[0].target_department.name if items[0].target_department else None,
                "customer_details": {
                    "name": customer_obj.name if customer_obj else "Walk-in Client",
                    "shipping_address": customer_obj.shipping_address if customer_obj else "N/A"
                },
                "products": [
                    {
                        "name": item.product.name,
                        "quantity": item.quantity,
                    } for item in items
                ]
            })
        return Response(response)

    def post(self, request):
        customer_id = request.data.get('customer') 
        customer_data = request.data.get('customer_data')
        items = request.data.get('items', [])
        target_department = request.data.get('target_department')

        if not items:
            return Response({"error": "Items required"}, status=400)

        with transaction.atomic():
            customer_obj = None
            if customer_id:
                customer_obj = get_object_or_404(Customer, id=customer_id)
            
           
            elif customer_data:
                customer_obj = Customer.objects.create(
                    name=customer_data.get('name'),
                    email=customer_data.get('email'),
                    phone=customer_data.get('phone'),
                    shipping_address=customer_data.get('shipping_address'),
                    tax_number=customer_data.get('tax_number')
                )
            else:
                return Response({"error": "Customer ID or New Customer Data is required"}, status=400)

            
            order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"  
            created_items = []

            for item in items:
                data = {
                    "Customer": customer_obj.id,  
                    "product": item.get("product"),
                    "quantity": item.get("quantity"),
                    "target_department": target_department,
                    "order_number": order_number   
                }

                serializer = OrderItemSerializer(data=data)
                if serializer.is_valid():
                    serializer.save()
                    created_items.append(serializer.data)
                else:
                    return Response(serializer.errors, status=400)

        return Response({
            "message": "Order and Customer managed successfully",
            "order_number": order_number,
            "items": created_items
        }, status=201)
    

class OrderReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        try:
            # 1. Find the assignment
            assignment = OrderAssignment.objects.get(id=task_id)
            
            # 2. Grab the specific order item linked to it
            # (Assuming your assignment model has an 'order_item' field)
            order_item = assignment.order
            
            # 3. Use the correct serializer
            serializer = OrderItemSerializer(order_item)
            
            print(serializer.data)  # This will now print the tax and customer details!
            return Response(serializer.data)
            
        except OrderAssignment.DoesNotExist:
            return Response({"detail": "Task assignment not found"}, status=404)



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

class AdminOrderUpdateView(APIView):
    permission_classes = [IsAdminUser]

    def put(self, request, order_number):
        items_data = request.data.get("items", [])

        orders = OrderItem.objects.filter(order_number=order_number)

        if not orders.exists():
            return Response({"error": "Order not found"}, status=404)

        # ❌ block editing confirmed/shipped orders
        if orders.first().status in ["CONFIRMED", "SHIPPED"]:
            return Response(
                {"error": "Cannot edit confirmed or shipped orders"},
                status=400
            )

        # update logic
        for item_data in items_data:
            item_id = item_data.get("id")
            quantity = item_data.get("quantity")

            try:
                item = OrderItem.objects.get(id=item_id, order_number=order_number)
                item.quantity = quantity
                item.save()

            except OrderItem.DoesNotExist:
                return Response({"error": "Item not found"}, status=404)

        return Response({"message": "Order updated successfully"}) 

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
    

class ManagerReworkAssignmentView(APIView):
    """
    POST /api/orders/manager/assignments/<id>/rework/
    Reverts an assignment to PACKING state and appends audit instructions for the staff.
    """
    permission_classes = [IsAuthenticated, IsManager]

    def post(self, request, pk):
        assignment = get_object_or_404(OrderAssignment, pk=pk)
        manager_note = request.data.get("note", "Verification failed. Rework required.")

        with transaction.atomic():
            # Reset workflow status to put it back onto the staff member's active terminal
            assignment.status = 'PACKING'
            assignment.verification_status = 'PENDING'
            assignment.approval_status = 'PENDING'
            assignment.save()

            # Optional: Log the remark context back to the primary OrderItems
            OrderItem.objects.filter(order_number=assignment.order.order_number).update(
                status='PROCESSING',
                rejection_reason=manager_note
            )

            # Alert staff member via Notification model instance
            Notification.objects.create(
                title="Rework Ordered",
                message=f"Order {assignment.order.order_number} returned for rework: {manager_note}",
                user=assignment.staff,
                department=assignment.department,
                created_by=self.request.user,
                notification_type='REJECTED'
            )

        return Response({"message": "Task reverted to packing workflow for staff rework."}, status=status.HTTP_200_OK)


class ManagerForceCycleCountView(APIView):
    """
    POST /api/orders/manager/assignments/<id>/force-cycle-count/
    Flags a shelf/product slot location variance and logs an urgent cycle count ticket.
    """
    permission_classes = [IsAuthenticated, IsManager]

    def post(self, request, pk):
        assignment = get_object_or_404(OrderAssignment, pk=pk)
        product = assignment.order.product 
        manager_note = request.data.get("note", "Mismatched quantities found during audit layers.")

        with transaction.atomic():
            # Create a localized cycle count alert inside your existing IssueReport infrastructure
            IssueReport.objects.create(
                product=product,
                reported_by=request.user, # Reported by Manager
                department=assignment.department,
                type="DISCREPANCY",
                description=f"URGENT CYCLE COUNT FORCED: {manager_note}. Verify physical layout.",
                urgency="HIGH"
            )
            
            # Reset verification layers safely
            assignment.verification_status = 'FAILED'
            assignment.save()

        return Response({"message": "Location discrepancy registered. Urgent physical cycle count scheduled."}, status=status.HTTP_201_CREATED)

class ManagerWriteOffQuarantineView(APIView):
    """
    POST /api/orders/manager/assignments/<id>/quarantine-writeoff/
    Manager confirms item mutilation, removes it from active inventory stock pools, 
    and opens a validation request ticket for Admins to adjust accounts.
    """
    permission_classes = [IsAuthenticated, IsManager]

    def post(self, request, pk):
        assignment = get_object_or_404(OrderAssignment, pk=pk)
        product = assignment.order.product
        quantity_damaged = assignment.order.quantity

        with transaction.atomic():
            # Decrement inventory stock pool maps
            product.total_stock = max(0, product.total_stock - quantity_damaged)
            if hasattr(product, 'committed_stock'):
                product.committed_stock = max(0, product.committed_stock - quantity_damaged)
            product.save()

            # Append issue dispatch request to Admin dashboard review stack
            IssueReport.objects.create(
                product=product,
                assignment=assignment,
                reported_by=request.user,
                department=assignment.department,
                type="DAMAGE",
                description=f"Manager requested physical quarantine & stock write-off for {quantity_damaged} units.",
                urgency="HIGH",
                is_escalated_to_admin=True # Pushes directly to AdminResolveIssueView
            )

        return Response({"message": "Inventory pool updated. Stock moved to isolation; write-off pending Admin confirmation."}, status=status.HTTP_200_OK)


class ManagerEscalateToBackorderView(APIView):
    """
    POST /api/orders/manager/assignments/<id>/escalate-backorder/
    Puts the task out of commission when safety buffers fall to zero, routing to Admin for fulfillment splits.
    """
    permission_classes = [IsAuthenticated, IsManager]

    def post(self, request, pk):
        assignment = get_object_or_404(OrderAssignment, pk=pk)
        
        with transaction.atomic():
            # Halt current task state progression safely
            assignment.status = 'PENDING'
            assignment.verification_status = 'FAILED'
            assignment.save()

            # Transition original order group items into an unfulfilled BACKORDER holding pattern
            OrderItem.objects.filter(order_number=assignment.order.order_number).update(
                status='PROCESSING', # Reverts confirmation phase
                rejection_reason="Escalated by Manager to Admin: Out of Stock (Backordered Fallback)"
            )

            # Generate explicit system visibility request
            IssueReport.objects.create(
                product=assignment.order.product,
                assignment=assignment,
                reported_by=request.user,
                department=assignment.department,
                type="MISSING",
                description="Zero stock safety threshold reached. Requesting Admin to trigger order-split or backorder communication flows.",
                urgency="HIGH",
                is_escalated_to_admin=True
            )

        return Response({"message": "Workflow locked. Escalated to administration tier for Backorder processing."}, status=status.HTTP_200_OK)
class ManagerFlagStaffIncidentView(APIView):
    """
    POST /api/orders/manager/staff/<username>/flag-incident/
    Logs an explicit performance failure marker directly on the employee profile context.
    """
    permission_classes = [IsAuthenticated, IsManager]

    def post(self, request, username):
        staff_member = get_object_or_404(User, username=username, role='staff')
        reason = request.data.get("reason", "Repeated packaging or auditing error variance.")

        # In a real ERP system, you can either save this to an explicit 
        # StaffIncident/Profile model or increment an error counter field.
        # Example using a Notification system to alert HR and the User:
        Notification.objects.create(
            title="Operational Quality Incident Flagged",
            
            created_by=self.request.user, 
            message=f"KPI Incident marked against performance metrics: {reason}",
            user=staff_member,
            notification_type='REJECTED'
        )

        return Response({"message": f"Performance incident file registered against staff: @{username}"}, status=status.HTTP_200_OK)
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
                "approval_status": first.approval_status,
                "verification_status": first.verification_status, # <--- ADD THIS LINE
                "deadline": first.deadline_date if first.deadline_date else None,
                "staff": first.staff.username if first.staff else None,
                "products": [
                    {   
                        "id": item.product.id,
                        "department_name": item.product.department.name if item.product.department else None,
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
    
class ManagerApproveOrderView(generics.RetrieveUpdateAPIView):
    queryset = OrderAssignment.objects.all()
    serializer_class = UpdateStatusSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        assignment = self.get_object()
        decision = self.request.data.get("decision")
        remarks = self.request.data.get("remarks", "")

        # ✅ Execute the decision logic
        assignment.manager_decision(decision, remarks=remarks)

        # ✅ FIX: Use assignment.order.order_number
        # Also ensure department is passed to avoid the previous IntegrityError
        Notification.objects.create(
            title="Manager Decision",
            created_by=self.request.user, 
            message=f"Order {assignment.order.order_number} {decision.lower()}: {remarks}",
            user=assignment.staff,
            department=assignment.department,
            notification_type='READY_TO_SHIP' if decision == 'APPROVED' else 'REJECTED'
        )
    
class ManagerDashboardStats(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
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
        low_stock_products = Product.objects.filter(
    total_stock__lte=F('min_stock_level')
)[:5]
        alerts = [
    {
        "id": f"stock_{p.id}",
        "message": f"Low Stock: {p.name} ({p.total_stock} left)"
    }
    for p in low_stock_products
]

        # 6. CRITICAL FIX: Ensure you actually RETURN the Response object
        return Response({
            "stats": stats,
            "staff_per_dept": list(staff_per_dept),
            "recent_tasks": list(recent_tasks),
            "alerts": alerts
        })
    

class ManagerRestockQueueView(APIView):
    # You can add custom permissions here to ensure only managers can access it
    
    def get(self, request):
        # Fetch all pending restock requests ordered by newest first
        requests = RestockRequest.objects.filter(status='PENDING').order_by('-created_at')
        
        data = [
            {
                "id": r.id,
                "staff_username": r.staff_member.username,
                "product_name": r.product.name,
                "sku": r.product.sku,
                "current_stock": r.product.total_stock,
                "reason": r.reason,
                "date": r.created_at.strftime("%Y-%m-%d %H:%M")
            }
            for r in requests
        ]
        return Response(data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        try:
            restock_req = RestockRequest.objects.get(id=pk)
        except RestockRequest.DoesNotExist:
            return Response({'error': 'Request not found'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status') # 'APPROVED' or 'REJECTED'
        if new_status in ['APPROVED', 'REJECTED']:
            with transaction.atomic():
                restock_req.status = new_status
                restock_req.save()

                # --- ADVANCED ERP ROUTING CONNECTION ---
                if new_status == 'APPROVED':
                    # Create an administrative inventory issue to request a new Purchase Order (PO)
                    IssueReport.objects.create(
                        product=restock_req.product,
                        reported_by=request.user,
                        department=restock_req.product.department,
                        type="STOCK_SHORTAGE",
                        description=f"Restock Request Approved by Manager. Generate PO for SKU: {restock_req.product.sku}.",
                        urgency="MEDIUM",
                        is_escalated_to_admin=True # Instantly viewable on Admin's issue pipeline
                    )

            return Response({'message': f'Request status updated to {new_status} and procurement pipeline notified.'})
        
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

class RequestRestockView(APIView):
    def get(self,request):
        user =request.user
        product_id =request.query_params.get('product_id')
        low_stock_products =Product.objects.filter(total_stock__lte=5)
        alerts = [
            {
                "id": f"stock_{p.id}", 
                "message": f"I want to restock {p.name} because of the mentioned issue ({p.total_stock} left)"
            }
            for p in low_stock_products
        ]
        product_data =None
        if product_id:
            product_data =Product.objects.filter(id=product_id).values('id','name').first()
        return Response({
            'product': product_data,
            'user': str(user), # passing user object directly can cause serialization errors
            'alerts': alerts,
        })
    def post(self,request):
        text_reason =request.data.get('text','')
        if not text_reason:
            return Response({'error':'Reason Text is required'},status=status.HTTP_400_BAD_REQUEST)
        return Response({
            'message': 'Restock request received successfully',
            'text': text_reason
        }, status=status.HTTP_201_CREATED)
    
    

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
class StaffTaskDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStaffFromDepartment]

    def get(self, request, pk):
        assignment = OrderAssignment.objects.get(
            id=pk,
            staff=request.user
        )

        order_number = assignment.order.order_number

        items = OrderItem.objects.filter(order_number=order_number)

        return Response({
            "id": assignment.id,
            "order_number": order_number,
            "department": assignment.department.name if assignment.department else None,
            "status": assignment.status,
            "approval_status": assignment.approval_status,
            "verification_status": assignment.verification_status,
            "deadline": assignment.deadline_date,
            "staff": assignment.staff.username if assignment.staff else None,

            # 🔥 THIS is the fix
            "products": [
                {
        "product_id": item.product.id, 
        "department_name": item.product.department.name if item.product.department else None,  # IMPORTANT
        "name": item.product.name,
        "sku": item.product.sku,
        "batch_number": item.product.batch_number,   # ADD THIS
        "category_name": item.product.category.name if item.product.category else None,
        "quantity": item.quantity,
        "status": item.status,
    }
                for item in items
            ]
        })
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
            if is_passed:
                assignment.process_verification('PASSED')
            else:
                assignment.process_verification('FAILED', description=comments)

            # FIXED: Moved stock metrics deduction block safely back inside perform_update scope
            if is_passed:
                # Basic Stock Check
                if product.total_stock < order_item.quantity:
                    raise ValidationError(f"Insufficient stock for {product.name}")
                
                # Deduct from Physical Total Stock
                product.total_stock -= order_item.quantity
        
                # Deduct from Reserved Allocation to prevent validation overrides
                if hasattr(product, 'committed_stock'):
                    product.committed_stock = max(0, product.committed_stock - order_item.quantity)

                product.save()
            else:
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