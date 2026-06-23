from collections import defaultdict
import uuid
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.utils import timezone
from django.db.models import Count, Q, F
from django.db import transaction
from django.shortcuts import get_object_or_404

# നിങ്ങളുടെ ആപ്പ് ഇംപോർട്ടുകൾ
from app.accounts.models import Department, User
from app.accounts.permissions import IsManager, IsStaffFromDepartment
from app.accounts.serializers import UserWorkloadSerializer

from app.inventory.models import Category, Product, Notification, IssueReport
from app.inventory.seriliazers import ProductSerializer

from .models import RestockRequest, Order, OrderItem, OrderAssignment
from .serilaizers import (
    OrderAssignmentSerializer, UpdateStatusSerializer, DepartmentManagerSerializer,
    CategorySerializer, ProductDetailSerializer, OrderItemSerializer, AssignOrderSerializer
)

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
        order = assignment.order  # മെയിൻ Order ഒബ്ജക്റ്റ്

        if decision == 'CANCEL':
            # 1. Update the Order status
            order.status = 'CANCELLED'
            order.rejection_reason = f"Admin Decision: {admin_note}"
            order.save()
            
            # 2. Update the Assignment and Issue Report
            assignment.is_cancelled = True
            assignment.save()
            
            report.is_reviewed_by_manager = True
            report.is_escalated_to_admin = False
            report.manager_remarks = admin_note
            report.save()

        elif decision == 'RETRY':
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

    def get(self, request):
        # മാതൃ ഓർഡറുകൾ ഡിസ്‌പ്ലേ ചെയ്യുന്നു
        orders = Order.objects.all().order_by('-id')
        response = []

        for order in orders:
            response.append({
                "order_number": order.order_number,
                "status": order.status,
                "target_department": order.target_department.name if order.target_department else None,
                "shipping_address": order.shipping_address,
                "payment_status": order.payment_status,
                "products": [
                    {
                        "name": item.product.name,
                        "quantity": item.quantity,
                        "unit_price": float(item.unit_price)
                    } for item in order.items.all()
                ]
            })
        return Response(response)

    def post(self, request):
        items = request.data.get('items', [])
        target_department_id = request.data.get('target_department')
        customer_id = request.data.get('customer') # കസ്റ്റമർ ID ഉണ്ടെങ്കിൽ

        if not items:
            return Response({"error": "Items required"}, status=400)

        with transaction.atomic():
            # 1. ആദ്യം ഒരു മെയിൻ Order ക്രിയേറ്റ് ചെയ്യുന്നു
            order = Order.objects.create(
                target_department_id=target_department_id,
                customer_id=customer_id
            )

            created_items = []
            # 2. ശേഷം ആ ഓർഡറിലേക്ക് ഓരോ ലൈൻ ഐറ്റംസും ചേർക്കുന്നു
            for item in items:
                product_id = item.get("product")
                quantity = item.get("quantity")
                product = get_object_or_404(Product, id=product_id)

                order_item = OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=quantity,
                    unit_price=product.price if hasattr(product, 'price') else 0.00 # വില ലോക്ക് ചെയ്യാൻ
                )
                created_items.append({
                    "id": order_item.id,
                    "product": product.id,
                    "quantity": order_item.quantity,
                    "order_number": order.order_number
                })

        return Response(created_items, status=201)


class productListView(generics.ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductDetailSerializer
    permission_classes = [IsAuthenticated]  


class DepartmentListView(generics.ListAPIView):
    queryset = Department.objects.select_related('manager').all()
    serializer_class = DepartmentManagerSerializer
    permission_classes = [IsAuthenticated]  


class AdminOrderUpdateView(APIView):
    permission_classes = [IsAdminUser]

    def put(self, request, order_number):
        items_data = request.data.get("items", [])
        order = get_object_or_404(Order, order_number=order_number)

        if order.status in ["CONFIRMED", "SHIPPED"]:
            return Response({"error": f"Cannot edit orders that are already {order.status}"}, status=400)

        with transaction.atomic():
            for item_data in items_data:
                item_id = item_data.get("id")
                quantity = item_data.get("quantity")

                try:
                    # Item ഐഡിയും മെയിൻ ഓർഡറും വെച്ച് കൃത്യമായി ഫിൽട്ടർ ചെയ്യുന്നു
                    item = OrderItem.objects.get(id=item_id, order=order)
                    item.quantity = quantity
                    item.save()
                except OrderItem.DoesNotExist:
                    return Response({"error": f"Item ID {item_id} not found in this order"}, status=404)

        return Response({"message": "Order updated successfully"})


class AdmnOrderRejectView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, order_number):
        order = get_object_or_404(Order, order_number=order_number)

        if order.status in ['SHIPPED', 'CANCELLED']:
            return Response({"error": f"Cannot reject an order that is already {order.status}."}, status=400)

        rejection_reason = request.data.get("rejection_reason", "").strip()
        if not rejection_reason:
            return Response({"error": "Rejection reason is required."}, status=400)

        with transaction.atomic():
            # ഓർഡർ കൺഫേംഡ് ആയിരുന്നെങ്കിൽ സ്റ്റോക്ക് റിസർവേഷൻ ഒഴിവാക്കുക
            if order.status in ['CONFIRMED', 'PROCESSING']:
                for item in order.items.all():
                    item.cancel_reservation()

            order.status = 'CANCELLED'
            order.rejection_reason = rejection_reason
            order.save()

        return Response({
            "message": f"Order {order_number} has been rejected and stock reservations released.",
            "status": "CANCELLED"
        }, status=200)


class AdminOrderConfirmView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, order_number):
        order = get_object_or_404(Order, order_number=order_number)

        # 1. എല്ലാ പ്രൊഡക്റ്റുകൾക്കും ആവശ്യത്തിന് സ്റ്റോക്ക് ഉണ്ടോ എന്ന് ആദ്യം പരിശോധിക്കുന്നു
        for item in order.items.all():
            if item.product.available_stock < item.quantity:
                return Response({
                    "error": f"Insufficient stock for {item.product.name}. Available: {item.product.available_stock}"
                }, status=400)

        # 2. സ്റ്റോക്ക് ഉണ്ടെങ്കിൽ അവ റിസർവ് ചെയ്യുക
        with transaction.atomic():
            for item in order.items.all():
                item.reserve_stock()
            
            order.status = 'CONFIRMED'
            order.save()

            # Warehouse Assignment നിർമ്മിക്കുന്നു
            OrderAssignment.objects.create(
                order=order,
                manager=request.user,
                department=order.target_department,
                status='PENDING'
            )

        return Response({"message": f"{order_number} confirmed and stock reserved."})


class ManagerReworkAssignmentView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def post(self, request, pk):
        assignment = get_object_or_404(OrderAssignment, pk=pk)
        manager_note = request.data.get("note", "Verification failed. Rework required.")

        with transaction.atomic():
            assignment.status = 'PACKING'
            assignment.verification_status = 'PENDING'
            assignment.approval_status = 'PENDING'
            assignment.save()

            # മാതൃ ഓർഡറിന്റെ സ്റ്റാറ്റസ് മാറ്റുന്നു
            order = assignment.order
            order.status = 'PROCESSING'
            order.rejection_reason = manager_note
            order.save()

            Notification.objects.create(
                title="Rework Ordered",
                message=f"Order {order.order_number} returned for rework: {manager_note}",
                user=assignment.staff,
                department=assignment.department,
                created_by=self.request.user,
                notification_type='REJECTED'
            )

        return Response({"message": "Task reverted to packing workflow for staff rework."}, status=200)


class ManagerForceCycleCountView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def post(self, request, pk):
        assignment = get_object_or_404(OrderAssignment, pk=pk)
        manager_note = request.data.get("note", "Mismatched quantities found during audit layers.")

        # ഓർഡറിലെ ആദ്യത്തെ പ്രൊഡക്റ്റ് എടുക്കുന്നു (അസൈൻമെന്റ് വെരിഫൈ ചെയ്യാൻ)
        first_item = assignment.order.items.first()
        product = first_item.product if first_item else None

        with transaction.atomic():
            IssueReport.objects.create(
                product=product,
                reported_by=request.user,
                department=assignment.department,
                type="DISCREPANCY",
                description=f"URGENT CYCLE COUNT FORCED: {manager_note}.",
                urgency="HIGH"
            )
            
            assignment.verification_status = 'FAILED'
            assignment.save()

        return Response({"message": "Location discrepancy registered. Urgent physical cycle count scheduled."}, status=201)


class ManagerWriteOffQuarantineView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def post(self, request, pk):
        assignment = get_object_or_404(OrderAssignment, pk=pk)
        order = assignment.order

        with transaction.atomic():
            # ഓർഡറിലുള്ള എല്ലാ ഐറ്റങ്ങളുടെയും സ്റ്റോക്ക് കുറയ്ക്കുന്നു
            for item in order.items.all():
                product = item.product
                quantity_damaged = item.quantity
                
                product.total_stock = max(0, product.total_stock - quantity_damaged)
                if hasattr(product, 'committed_stock'):
                    product.committed_stock = max(0, product.committed_stock - quantity_damaged)
                product.save()

                IssueReport.objects.create(
                    product=product,
                    assignment=assignment,
                    reported_by=request.user,
                    department=assignment.department,
                    type="DAMAGE",
                    description=f"Manager requested write-off for {quantity_damaged} units.",
                    urgency="HIGH",
                    is_escalated_to_admin=True
                )

        return Response({"message": "Inventory pool updated. Stock moved to isolation; write-off pending Admin confirmation."}, status=200)


class ManagerEscalateToBackorderView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def post(self, request, pk):
        assignment = get_object_or_404(OrderAssignment, pk=pk)
        order = assignment.order
        
        with transaction.atomic():
            assignment.status = 'PENDING'
            assignment.verification_status = 'FAILED'
            assignment.save()

            order.status = 'PROCESSING'
            order.rejection_reason = "Escalated by Manager to Admin: Out of Stock (Backordered Fallback)"
            order.save()

            # എല്ലാ പ്രൊഡക്റ്റുകൾക്കും ഓരോ ഇഷ്യൂ റിപ്പോർട്ട് ക്രിയേറ്റ് ചെയ്യുന്നു
            for item in order.items.all():
                IssueReport.objects.create(
                    product=item.product,
                    assignment=assignment,
                    reported_by=request.user,
                    department=assignment.department,
                    type="MISSING",
                    description="Zero stock safety threshold reached. Requesting Admin backorder flow.",
                    urgency="HIGH",
                    is_escalated_to_admin=True
                )

        return Response({"message": "Workflow locked. Escalated to administration tier for Backorder processing."}, status=200)


class ManagerFlagStaffIncidentView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def post(self, request, username):
        staff_member = get_object_or_404(User, username=username, role='staff')
        reason = request.data.get("reason", "Repeated packaging or auditing error variance.")

        Notification.objects.create(
            title="Operational Quality Incident Flagged",
            created_by=self.request.user, 
            message=f"KPI Incident marked against performance metrics: {reason}",
            user=staff_member,
            notification_type='REJECTED'
        )
        return Response({"message": f"Performance incident file registered against staff: @{username}"}, status=200)


class ManagerAssignmentListView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        assignments = OrderAssignment.objects.select_related(
            'order', 'department', 'staff'
        ).filter(
            status__in=['PENDING', 'PICKING', 'PACKING', 'PACKED', 'SHIPPED']
        ).order_by('-assigned_at')
        
        response = []

        for a in assignments:
            order = a.order
            response.append({
                "id": a.id,
                "order_number": order.order_number,
                "department": a.department.name if a.department else None,
                "status": a.status,
                "approval_status": a.approval_status,
                "verification_status": a.verification_status,
                "deadline": a.deadline_date if a.deadline_date else None,
                "staff": a.staff.username if a.staff else None,
                "products": [
                    {   
                        "id": item.product.id,
                        "department_name": item.product.department.name if item.product.department else None,
                        "name": item.product.name,
                        "quantity": item.quantity
                    } for item in order.items.all()
                ]
            })

        return Response(response)


class ManagerAssignStaffView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def post(self, request, pk):
        assignment = get_object_or_404(OrderAssignment, pk=pk)
        serializer = AssignOrderSerializer(
            assignment, data=request.data, context={'request': request}, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": f"Task assigned to {assignment.staff.username}",
                "staff": assignment.staff.username
            }, status=200)
        return Response(serializer.errors, status=400)


class ManagerStaffFulfillmentView(APIView):
    permission_classes = [IsManager]

    def get(self, request):
        staff_list = User.objects.filter(role='staff').annotate(
            current_tasks=Count(
                'assigned_orders',
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

        assignment.manager_decision(decision, remarks=remarks)

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
        staff_per_dept = User.objects.filter(role='staff')\
            .values('department__name')\
            .annotate(count=Count('id'))\
            .order_by('department__name')

        stats = {
            "total_staff": User.objects.filter(role='staff').count(),
            "active_tasks": OrderAssignment.objects.filter(status='PACKING').count(),
            "completed_shipments": OrderAssignment.objects.filter(status__in=['PACKED', 'SHIPPED']).count(),
            "overdue": OrderAssignment.objects.filter(
                status__in=['PENDING', 'PACKING'],
                deadline_date__lt=timezone.now().date()
            ).count(),
        }

        recent_tasks = OrderAssignment.objects.order_by('-assigned_at')[:5].values(
            'id', 'order__order_number', 'status', 'staff__username'
        )

        low_stock_products = Product.objects.filter(total_stock__lte=F('min_stock_level'))[:5]
        alerts = [
            {"id": f"stock_{p.id}", "message": f"Low Stock: {p.name} ({p.total_stock} left)"}
            for p in low_stock_products
        ]

        return Response({
            "stats": stats,
            "staff_per_dept": list(staff_per_dept),
            "recent_tasks": list(recent_tasks),
            "alerts": alerts
        })


class ManagerRestockQueueView(APIView):
    def get(self, request):
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
            } for r in requests
        ]
        return Response(data, status=200)

    def patch(self, request, pk):
        try:
            restock_req = RestockRequest.objects.get(id=pk)
        except RestockRequest.DoesNotExist:
            return Response({'error': 'Request not found'}, status=404)

        new_status = request.data.get('status')
        if new_status in ['APPROVED', 'REJECTED']:
            with transaction.atomic():
                restock_req.status = new_status
                restock_req.save()

                if new_status == 'APPROVED':
                    IssueReport.objects.create(
                        product=restock_req.product,
                        reported_by=request.user,
                        department=restock_req.product.department,
                        type="STOCK_SHORTAGE",
                        description=f"Restock Request Approved. Generate PO for SKU: {restock_req.product.sku}.",
                        urgency="MEDIUM",
                        is_escalated_to_admin=True
                    )
            return Response({'message': f'Request status updated to {new_status} and procurement pipeline notified.'})
        return Response({'error': 'Invalid status'}, status=400)


class RequestRestockView(APIView):
    def get(self, request):
        user = request.user
        product_id = request.query_params.get('product_id')
        low_stock_products = Product.objects.filter(total_stock__lte=5)
        alerts = [
            {
                "id": f"stock_{p.id}", 
                "message": f"I want to restock {p.name} because of the mentioned issue ({p.total_stock} left)"
            } for p in low_stock_products
        ]
        product_data = None
        if product_id:
            product_data = Product.objects.filter(id=product_id).values('id', 'name').first()
        return Response({
            'product': product_data,
            'user': str(user),
            'alerts': alerts,
        })

    def post(self, request):
        text_reason = request.data.get('text', '')
        if not text_reason:
            return Response({'error': 'Reason Text is required'}, status=400)
        return Response({
            'message': 'Restock request received successfully',
            'text': text_reason
        }, status=201)


class StaffDashboardTasksView(generics.ListAPIView):
    serializer_class = OrderAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffFromDepartment]

    def get_queryset(self):
        return OrderAssignment.objects.filter(staff=self.request.user).order_by('status', 'deadline_date')


class StaffUpdateTaskStatusView(generics.UpdateAPIView):
    serializer_class = UpdateStatusSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffFromDepartment]

    def get_queryset(self):
        return OrderAssignment.objects.filter(staff=self.request.user)

    def perform_update(self, serializer):
        assignment = self.get_object()
        new_status = self.request.data.get("status")

        if new_status in ['PENDING', 'PICKING', 'PACKING', 'PACKED']:
            assignment.status = new_status
            assignment.save()

        elif new_status == 'SHIPPED':
            if assignment.approval_status != 'APPROVED':
                raise ValidationError("Manager approval required before shipping")

            assignment.status = 'SHIPPED'
            assignment.completed_at = timezone.now()
            assignment.save()

        # മെയിൻ ഓർഡറിന്റെ സ്റ്റാറ്റസ് മെത്തേഡ് വിളിക്കുന്നു
        assignment.order.update_status_from_assignments()


class StaffTaskDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStaffFromDepartment]

    def get(self, request, pk):
        assignment = get_object_or_404(OrderAssignment, id=pk, staff=request.user)
        order = assignment.order

        return Response({
            "id": assignment.id,
            "order_number": order.order_number,
            "department": assignment.department.name if assignment.department else None,
            "status": assignment.status,
            "approval_status": assignment.approval_status,
            "verification_status": assignment.verification_status,
            "deadline": assignment.deadline_date,
            "staff": assignment.staff.username if assignment.staff else None,
            "products": [
                {
                    "product_id": item.product.id, 
                    "department_name": item.product.department.name if item.product.department else None,
                    "name": item.product.name,
                    "sku": item.product.sku,
                    "batch_number": item.product.batch_number,
                    "category_name": item.product.category.name if item.product.category else None,
                    "quantity": item.quantity,
                    "status": order.status, # മുകളിലെ പ്രോപ്പർട്ടി വഴി
                } for item in order.items.all()
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
        return Response({"message": "Issue reported successfully"})


class StaffTaskInspectView(generics.UpdateAPIView):
    serializer_class = OrderAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return OrderAssignment.objects.filter(staff=self.request.user)

    def perform_update(self, serializer):
        with transaction.atomic():
            assignment = self.get_object()
            is_passed = self.request.data.get('is_passed', False)
            comments = self.request.data.get('comments', "")

            serializer.save()

            if not assignment.order:
                raise ValidationError("Missing order reference")

            order = assignment.order

            if is_passed:
                assignment.process_verification('PASSED')
                # ഓർഡറിലുള്ള മുഴുവൻ പ്രൊഡക്റ്റിന്റെയും സ്റ്റോക്ക് കുറയ്ക്കുന്നു
                for item in order.items.all():
                    product = item.product
                    if product.total_stock < item.quantity:
                        raise ValidationError(f"Insufficient stock for {product.name}")
                    
                    product.total_stock -= item.quantity
                    if hasattr(product, 'committed_stock'):
                        product.committed_stock = max(0, product.committed_stock - item.quantity)
                    product.save()
            else:
                assignment.process_verification('FAILED', description=comments)
                for item in order.items.all():
                    product = item.product
                    product.status = 'DAMAGED'
                    product.save()


class TaskStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        stats = OrderAssignment.objects.filter(staff=request.user).values('status').annotate(total=Count('id'))
        stats_dict = {item['status']: item['total'] for item in stats}
        
        response_data = {
            "total_assigned": sum(stats_dict.values()),
            "pending": stats_dict.get('PENDING', 0),
            "packing": stats_dict.get('PACKING', 0),
            "packed": stats_dict.get('PACKED', 0),
            "shipped": stats_dict.get('SHIPPED', 0),
        }
        return Response(response_data)


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]