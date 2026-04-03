from django.urls import path
from .views import ManagerReportView,AdminDashboardStats

urlpatterns = [
    path('manager-stats/',ManagerReportView.as_view(),name='manager-stats'),
    path('admin-stats/',AdminDashboardStats.as_view,name='admin-stats')
    
]
