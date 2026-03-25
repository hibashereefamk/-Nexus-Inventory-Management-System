from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    ROLE_CHOICE=(
        ('admin','Admin'),
        ('manager','Manager'),
        ('staff','Staff'),

    )

    role = models.CharField(max_length=50,choices=ROLE_CHOICE)
    email=models.EmailField(unique=True)
    phone=models.CharField(max_length=20,unique=True,null=True,blank=True)
    address =models.CharField(max_length=255,blank=True,null=True)
    is_active=models.BooleanField(default=True)
    is_staff=models.BooleanField(default=False)
    profile_picture =models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    otp = models.CharField(max_length=6, null=True, blank=True)
    otp_created_at = models.DateTimeField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    bio =models.TextField(blank=True,null =True)
    created_at = models.DateTimeField(auto_now_add= True)

    is_deleted = models.BooleanField(default=False) 
    department = models.ForeignKey('Department', on_delete=models.SET_NULL, null=True, blank=True)
    USERNAME_FIELD ='email'
    REQUIRED_FIELDS =['username']
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    def soft_delete(self):
        self.is_deleted = True
        self.is_active =False


class UserActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=255) 
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.action} at {self.timestamp}"

class Department(models.Model):

    name = models.CharField(max_length=100, unique=True)
    slug=models.SlugField(max_length=120,unique=True,blank=True)
    description = models.TextField(blank=True)
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='managed_department')

    def __str__(self):
        return self.name
    

class Permission(models.Model):
    name = models.CharField(max_length=100, unique=True) 
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class RolePermission(models.Model):
    ROLE_CHOICES = (
        ('admin','Admin'),
        ('manager','Manager'),
        ('staff','Staff'),
    )
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    permissions = models.ManyToManyField(Permission)

    def __str__(self):
        return f"Permissions for {self.get_role_display()}"