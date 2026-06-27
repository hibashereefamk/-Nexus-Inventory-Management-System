from django.urls import include, path
from .views import (NotificationMarkReadView, OrderShippingReviewDetailView, Productview,IssueReportCreateView,ManagerIssueListView,NotificationListView,ManagerEscalateIssueView,DepartmentStaffListView, VerificationViewSet)
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'verify-products', VerificationViewSet, basename='verify-products')

urlpatterns = [
    path('products/',Productview.as_view(),name='product_viwe'),
    path('products/<int:pk>/', Productview.as_view(), name='product-detail'),
    path('report-issue/', IssueReportCreateView.as_view(), name='report-issue'),
    path('manager/pending-issues/<int:pk>/escalate/', ManagerIssueListView.as_view(), name='manager-issues'),
    path('notifications/', NotificationListView.as_view(), name='notifications'),
    path('notifications/<int:pk>/', NotificationMarkReadView.as_view(),name='notification-read'),
    path('issue-reports/<int:pk>/escalate/',ManagerEscalateIssueView.as_view(),name='manager_report'),
    path('manager-department-assign/',DepartmentStaffListView.as_view(),name='dept-manger-view'),
    path('order-custom-details/',OrderShippingReviewDetailView.as_view(),name='order-custom-details'),  
    path('', include(router.urls)),
]

