from django.urls import include, path
from .views import (Productview,IssueReportCreateView,ManagerIssueListView,NotificationListView,ManagerEscalateIssueView,DepartmentStaffListView, VerificationViewSet, AssignmentVerificationView)
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'verify-products', VerificationViewSet, basename='verify-products')

urlpatterns = [
    path('products/',Productview.as_view(),name='product_viwe'),
    path('products/<int:pk>/', Productview.as_view(), name='product-detail'),
    path('assignment-verification/<int:assignment_id>/', AssignmentVerificationView.as_view(), name='assignment-verification'),
    path('report-issue/', IssueReportCreateView.as_view(), name='report-issue'),
    path('manager/pending-issues/<int:pk>/escalate/', ManagerIssueListView.as_view(), name='manager-issues'),
    path('notifications/', NotificationListView.as_view(), name='notifications'),
    path('issue-reports/<int:pk>/escalate/',ManagerEscalateIssueView.as_view(),name='manager_report'),
    path('manager-department-assign/',DepartmentStaffListView.as_view(),name='dept-manger-view'),
    path('', include(router.urls)),
]

