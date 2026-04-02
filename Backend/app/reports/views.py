from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Avg, F
from app.inventory.models import Product, IssueReport, Notification
from app.accounts.permissions import IsManager,IsSuperAdmin
from django.utils import timezone
from django.db.models import Count
from datetime import timedelta

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
    
class AdminStatsView(APIView):
        permission_classes = [IsSuperAdmin]

        def get(self, request):
            now = timezone.now()
            start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # 1. Monthly Orders Calculation
            total_orders_month = Order.objects.filter(
            created_at__gte=start_of_month
            ).count()

        # 2. Total Overdue Calculation (e.g., items not returned or tasks late)
            total_overdue = Order.objects.filter(
            status='overdue', 
            due_date__lt=now
            ).count()

        # 3. Active Staff Count
            active_staff_count = Staff.objects.filter(is_active=True).count()

        # 4. Recent Alerts (Example: Low stock or system errors)
        # Fetching the last 3 critical alerts
            recent_alerts_queryset = Alert.objects.filter(
            severity='high'
        ).order_by('-created_at')[:3]
        
            recent_alerts = [
            {"message": alert.message} for alert in recent_alerts_queryset
        ]

        # Construct the response object to match your React frontend expectations
            data = {
            "total_orders_month": total_orders_month,
            "total_overdue": total_overdue,
            "active_staff_count": active_staff_count,
            "recent_alerts": recent_alerts,
        }

            return Response(data)