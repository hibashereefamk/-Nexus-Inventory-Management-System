from django.contrib import admin
from .models import User,Department


class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'role', 'is_active')
    search_fields = ('email',)
    list_filter = ('role', 'is_active')
    ordering = ('id',)


class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'manager')
    search_fields = ('name',)
    ordering = ('id',)

admin.site.register(User, UserAdmin)
admin.site.register(Department, DepartmentAdmin)