from django.urls import path


from .views import (
    AdminOrderListCreateView, AdminOrderConfirmView, AdminOrderUpdateView, AdminResolveIssueView, ManagerApproveOrderView,
    ManagerAssignmentListView, ManagerAssignStaffView,
    ManagerStaffFulfillmentView, ManagerDashboardStats,
    StaffDashboardTasksView, StaffUpdateTaskStatusView,
    StaffTaskDetailView, StaffTaskInspectView, TaskStatsView,
    DepartmentListView, CategoryListView, productListView,AdmnOrderRejectView,StaffCreateIssueView
)

urlpatterns = [
    # --- ADMIN ENDPOINTS ---
    path('admin/orders/', AdminOrderListCreateView.as_view(), name='admin-order-list'),
    path('admin/orders/<str:order_number>/confirm/', AdminOrderConfirmView.as_view(), name='admin-order-confirm'),
    path('admin/orders/<str:order_number>/reject/', AdmnOrderRejectView.as_view(), name='admin-order-reject'),
    path('admin/orders/resolve-issue/',AdminResolveIssueView.as_view(), name='admin-resolve-issue'),
    path('admin/orders/<str:order_number>/update/', AdminOrderUpdateView.as_view(), name='admin-order-update'),
    # --- MANAGER ENDPOINTS ---
    path('manager/dashboard/', ManagerDashboardStats.as_view(), name='manager-dashboard'),
    path('manager/assignments/', ManagerAssignmentListView.as_view(), name='manager-assignment-list'),
    path('manager/assignments/<int:pk>/assign-staff/', ManagerAssignStaffView.as_view(), name='manager-assign-staff'),
    path('manager/fulfillment-data/', ManagerStaffFulfillmentView.as_view(), name='manager-fulfillment-data'),
    path('manager/departments/', DepartmentListView.as_view(), name='department-list'),
    # urls.py
    path('manager/approve-order/<int:pk>/', ManagerApproveOrderView.as_view(), name='manager-app-shipping'),

    path('staff/tasks/', StaffDashboardTasksView.as_view(), name='staff-tasks'),
    path('staff/tasks/<int:pk>/', StaffTaskDetailView.as_view(), name='staff-task-detail'),
    path('staff/update-task/<int:pk>/', StaffUpdateTaskStatusView.as_view(), name='staff-task-update'),
    path('staff/tasks/<int:pk>/inspect/', StaffTaskInspectView.as_view(), name='staff-task-inspect'),
    path('staff/stats/', TaskStatsView.as_view(), name='staff-stats'),
    path('staff/report-issue/', StaffCreateIssueView.as_view()),

    path('products-short/', productListView.as_view(), name='product-list'),
    path('departments/', DepartmentListView.as_view(), name='department-list'),
    path('categories/', CategoryListView.as_view(), name='category-list'),           
]










