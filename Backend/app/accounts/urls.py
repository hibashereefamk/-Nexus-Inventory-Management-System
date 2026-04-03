from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (LoginAPIView, LogoutView, VerifyOTPAPIView,UserListCreateAPIView, UserDetailAPIView,ResendOTPView,RequestPasswordResetEmailView,PasswordResetConfirmView,SystemLogListView
,DepartmentView,UserProfileView,DepartmentStaffListView)

urlpatterns = [
    path('users/', UserListCreateAPIView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserDetailAPIView.as_view(), name='user-detail'),
    path('login/', LoginAPIView.as_view(), name='login'),
    path('verify-otp/', VerifyOTPAPIView.as_view(), name='verify-otp'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('department/',DepartmentView.as_view(),name='department'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('request-reset/', RequestPasswordResetEmailView.as_view(), name="request-reset"),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path('api/settings/logs/', SystemLogListView.as_view(),name='settings-logs'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('department-staff/', DepartmentStaffListView.as_view(), name='dept-staff'),
]
   