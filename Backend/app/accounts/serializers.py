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


   

    