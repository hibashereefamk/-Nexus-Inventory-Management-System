from .views import StaffDashboardTasksView,ManagerCreateAssignmentView
from django.urls import path

urlpatterns = [
    path('staff-dashboard/',StaffDashboardTasksView.as_view(),name='staff-dashboard'),
    path('manager-dashboard',ManagerCreateAssignmentView.as_view(),name='manager-dashboard'),
]
