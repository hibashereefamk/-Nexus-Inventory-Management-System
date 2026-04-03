from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Avg, F
from app.inventory.models import Product, IssueReport, Notification
from app.accounts.permissions import IsManager,IsSuperAdmin
from django.utils import timezone
from django.db.models import Count
from datetime import timedelta
from app.accounts.models import User
from app.tasks.models import OrderAssignment
from app.inventory.models import Product
from django.db.models import Q

class ManagerReportView(APIView):
    permission_classes = [IsManager]

    def get(self, request):
        user_dept = request.user.department
        
        # 1. Performance: Average time to move from created to PACKED
        # Note: Requires a 'created_at' field in your Product model
        avg_packing_time = Product.objects.filter(
            department=user_dept, 
            status='PACKED'
        ).aggregate(avg_time=Avg(F('assigned_at') - F('created_at')))

        # 2. Damage Reports Summary
        damage_count = IssueReport.objects.filter(
            department=user_dept, 
            is_reviewed_by_manager=False
        ).count()

        # 3. Inventory Health
        low_stock_items = Product.objects.filter(
            department=user_dept, 
            total_stock__lt=10 # Example threshold
        ).count()

        return Response({
            "department_name": user_dept.name if user_dept else "General",
            "performance": {
                "avg_packing_hours": avg_packing_time['avg_time'].total_seconds() / 3600 if avg_packing_time['avg_time'] else 0,
                "pending_issues": damage_count
            },
            "inventory_summary": {
                "low_stock_alerts": low_stock_items,
                "total_active_products": Product.objects.filter(department=user_dept).count()
            }
        })
    
class AdminDashboardStats(APIView):
    # Using your existing custom permission class
    permission_classes = [IsSuperAdmin] 

    def get(self, request):
        now = timezone.now()
        # Calculate the first day of the current month
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # 1. Monthly Orders Calculation
        # Uses OrderAssignment as per your tasks/models.py
        total_orders_month = OrderAssignment.objects.filter(
            assigned_at__gte=start_of_month
        ).count()

        # 2. Total Overdue Calculation
        # Uses the 'OVERDUE' status defined in your OrderAssignment model
        # Or filters by deadline_date if the status hasn't been updated yet
        total_overdue = OrderAssignment.objects.filter(
            Q(status='OVERDUE') | 
            Q(status__in=['PENDING', 'PACKING'], deadline_date__lt=now.date())
        ).count()

        # 3. Active Staff Count
        # Uses your custom User model and filters by 'staff' role
        active_staff_count = User.objects.filter(
            role='staff', 
            is_active=True,
            is_deleted=False
        ).count()

        # 4. Recent Alerts
        # Uses your Notification model from inventory/models.py
        # Fetching last 3 unread notifications
        recent_alerts_queryset = Notification.objects.filter(
            is_read=False
        ).order_by('-created_at')[:3]
        
        recent_alerts = [
            {
                "id": alert.id,
                "title": alert.title,
                "message": alert.message,
                "type": alert.notification_type
            } for alert in recent_alerts_queryset
        ]

        # Construct the response object
        data = {
            "total_orders_month": total_orders_month,
            "total_overdue": total_overdue,
            "active_staff_count": active_staff_count,
            "recent_alerts": recent_alerts,
        }

        return Response(data)