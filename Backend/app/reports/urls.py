from django.urls import path
from .views import ManagerReportView,AdminStatsView

urlpatterns = [
    path('manager-stats/',ManagerReportView.as_view(),name='manager-stats'),
    path('admin-stats/',AdminStatsView.as_view,name='admin-stats')
    
]
