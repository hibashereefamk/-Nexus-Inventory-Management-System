from django.urls import path
from .views import AdminOrderListCreateView, AdminOrderConfirmView, ManagerAssignStaffView, ManagerAssignmentListView

urlpatterns = [
    path('admin-orders/', AdminOrderListCreateView.as_view()),
    path('admin-orders/<int:pk>/confirm/', AdminOrderConfirmView.as_view()),
    path('manager-assignments/', ManagerAssignmentListView.as_view()),
    path('manager-assignments/<int:pk>/assign-staff/', ManagerAssignStaffView.as_view()),
]















# from .views import (StaffDashboardTasksView,ManagerCreateOrderView,ManagerDashboardStats,StaffUpdateTaskStatusView,StaffTaskDetailView,TaskStatsView,StaffTaskInspectView
#                     ,ManagerTaskListView,ManagerAssignOrderView,DepartmentListView,ManagerStaffFulfillmentView)
# from django.urls import path

# # Backend/app/tasks/urls.py
# urlpatterns = [
#     # STAFF
#     path('staff/tasks/', StaffDashboardTasksView.as_view()),
#     path('staff/tasks/<int:pk>/', StaffTaskDetailView.as_view()),
#     path('staff/update-task/<int:pk>/', StaffUpdateTaskStatusView.as_view()),
#     path('staff/tasks/<int:pk>/inspect/', StaffTaskInspectView.as_view()),
#     path('staff/stats/', TaskStatsView.as_view()),

#     # MANAGER
#     path('manager/create-order/', ManagerCreateOrderView.as_view()),
#     path('manager/dashboard/', ManagerDashboardStats.as_view()),
#     path('manager/list/', ManagerTaskListView.as_view()),

#     # 🔥 IMPORTANT
#     path('manager/assign-data/', ManagerStaffFulfillmentView.as_view()),  # GET (suggestions)
#     path('manager/orders/<int:pk>/assign/', ManagerAssignOrderView.as_view()),  # PATCH (assign)

#     path('manager/department/staff/', DepartmentListView.as_view()),
# ]