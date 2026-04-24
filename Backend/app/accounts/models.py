from django.contrib.auth.models import AbstractUser, Group, Permission as AuthPermission
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

class User(AbstractUser):
    ROLE_CHOICE = (
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('staff', 'Staff'),
    )

    role = models.CharField(max_length=50, choices=ROLE_CHOICE)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    otp = models.CharField(max_length=6, null=True, blank=True)
    otp_created_at = models.DateTimeField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    bio = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)
    department = models.ForeignKey('Department', on_delete=models.SET_NULL, null=True, blank=True)

    # ADD THESE TWO FIELDS TO FIX THE ERROR
    groups = models.ManyToManyField(
        Group,
        related_name='custom_user_set',
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        AuthPermission,
        related_name='custom_user_permissions_set',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    def soft_delete(self):
        self.is_deleted = True
        self.is_active = False
    @property
    def is_management(self):
        """Returns True if the user has permission to add products or manage roles."""
        return self.role in ['admin', 'manager']

    def __str__(self):
        return f"{self.email} ({self.role})"


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
    


class SystemLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    @classmethod
    def log_event(cls, user, action, request=None):
        # The logic causing the error is likely here
        ip = "127.0.0.1" # Default to local IP
        if request:
            ip = request.META.get('REMOTE_ADDR')
        else:
            # DO NOT USE "Internal System" here! 
            # Use a dummy IP or None
            ip = "127.0.0.1" 
        
        cls.objects.create(user=user, action=action, ip_address=ip)
# Automatic Log for User Profile Changes
@receiver(post_save, sender=User)
def log_user_changes(sender, instance, created, **kwargs):
    if created:
        action = f"New Account Created: {instance.email} ({instance.role})"
    else:
        action = f"Profile Updated: {instance.email}"
    
    SystemLog.log_event(user=instance, action=action)