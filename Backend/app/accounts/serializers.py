from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User,Department,SystemLog
from .utils import generate_otp, Util
from django.utils import timezone


class UserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    department_name = serializers.ReadOnlyField(source='department.name')
    class Meta:
        model =User
        fields=[
            'id','username','email','role','role_display','phone','address','bio',
            'profile_picture','department_name','is_active','is_verified'
        ]
        read_only_fields = ['is_management']
    def create(self,validated_data):
        user= User.objects.create(
            email =validated_data['email'],
            username=validated_data['username'],
            role =validated_data['role'],
            is_active =False
        )
        return user

class DepartmentSerializer(serializers.ModelSerializer):
    manager = serializers.SlugRelatedField(
        slug_field='role', 
        queryset=User.objects.all()
    )

    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'manager']


class UserRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'role', 'department', 'phone']

    def create(self, validated_data):
        user = User.objects.create(
            email=validated_data['email'],
            username=validated_data['username'],
            role=validated_data['role'],
            department=validated_data.get('department'),
            phone=validated_data.get('phone'),
            is_active=False 
        )

        otp = generate_otp()
        user.otp = otp
        user.otp_created_at = timezone.now()
        user.save()
        Util.send_email(user, otp)

        return user

class VerifyOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    password = serializers.CharField(write_only=True, min_length=8)

class LoginSerializers(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        user = authenticate(email=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password")
        if not user.is_active:
            raise serializers.ValidationError("Please verify your OTP first")
        if user.is_deleted:
            raise serializers.ValidationError("This account has been deleted")
        return user
class SystemLogSerializer(serializers.ModelSerializer):

    class Meta:
        model= SystemLog
        fields ='__all__'


class UserProfileSerializer(serializers.ModelSerializer):
    # If you have a custom Profile model linked to User, include those fields here
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'groups']
from rest_framework import serializers
from .models import User
from app.tasks.models import OrderAssignment

class UserWorkloadSerializer(serializers.ModelSerializer):
    # These are COMPUTED fields (not in your database model)
    active_tasks_count = serializers.SerializerMethodField()
    workload_status = serializers.SerializerMethodField()
    department = serializers.ReadOnlyField(source='department.name')
    # This pulls the name from the related Department model
    zone_name = serializers.ReadOnlyField(source='warehouse_zone.name')

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role','department',
            'is_available', 'active_tasks_count', 
            'workload_status', 'zone_name'
        ]

    def get_active_tasks_count(self, obj):
        # Dynamically count tasks from the Task app
        return OrderAssignment.objects.filter(
            staff=obj, 
            status__in=['PENDING', 'PACKING']
        ).count()

    def get_workload_status(self, obj):
        count = self.get_active_tasks_count(obj)
        if count == 0: return "Low"
        if count <= 3: return "Med"
        return "High"

    def get_workload_status(self, obj):
        # Determines the color for the heatmap (Low, Med, High)
        count = self.get_active_tasks_count(obj)
        if count == 0: return "Low"
        if 1 <= count <= 3: return "Med"
        return "High"
   

    