from django.urls import path
from .views import (Productview,IssueReportCreateView,ManagerIssueListView,NotificationListView,ManagerEscalateIssueView,DepartmentStaffListView)


urlpatterns = [
    path('products/',Productview.as_view(),name='product_viwe'),
    path('products/<int:pk>/', Productview.as_view(), name='product-detail'),
    path('report-issue/', IssueReportCreateView.as_view(), name='report-issue'),
    path('manager/pending-issues/<int:pk>/escalate/', ManagerIssueListView.as_view(), name='manager-issues'),
    path('notifications/', NotificationListView.as_view(), name='notifications'),
    path('issue-reports/<int:pk>/escalate/',ManagerEscalateIssueView.as_view(),name='manager_report'),
    path('manager-department-assign',DepartmentStaffListView.as_view(),name='dept-manger-view')

]

