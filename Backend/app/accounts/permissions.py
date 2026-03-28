from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):

    def has_permission(self,request,view):
        return(
            request.user and 
            request.user.is_authenticated and 
            request.user.role =='admin'
        )

class IsManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == 'manager' or request.user.role == 'admin')
        )

class IsStaffFromDepartment(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        return bool(request.user and 
            request.user.is_authenticated and request.user.department == obj.department)
