from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.utils import timezone
from .models import User,Department
from .serializers import UserSerializer, UserRegistrationSerializer, VerifyOtpSerializer, LoginSerializers,DepartmentSerializer
from .permissions import IsSuperAdmin
from .utils import is_otp_expired
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated,AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserActivityLog
from .utils import Util,generate_otp

from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.core.mail import send_mail
from django.conf import settings

class UserListCreateAPIView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsSuperAdmin()]
        return [permissions.IsAuthenticated()]

    def get(self, request):
        users = User.objects.filter(is_deleted=False)
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save() 
            
            return Response({
                "message": "User created. OTP sent to email"
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class UserDetailAPIView(APIView):
    permission_classes = [IsSuperAdmin]

    def get_object(self, pk):
        try:
            return User.objects.get(pk=pk, is_deleted=False)
        except User.DoesNotExist:
            return None

    def get(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({"error": "User not found or has been deleted"}, status=status.HTTP_404_NOT_FOUND)
        serializer = UserSerializer(user)
        return Response(serializer.data)

    def put(self, request, pk):
        user = self.get_object(pk)
        if not user:
             return Response({"error": "Cannot update a deleted user"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    def patch(self, request, pk):
        return self.put(request, pk)
    
    def delete(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        user.is_active = False
        user.is_deleted = True
        user.save()
        return Response({"message": "User deactivated successfully"}, status=status.HTTP_204_NO_CONTENT)

class VerifyOTPAPIView(APIView):
    def post(self, request):
        email = request.data.get("email")
        otp = request.data.get("otp")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        if user.otp != otp:
            return Response({"error": "Invalid OTP"}, status=400)

        if is_otp_expired(user.otp_created_at):
            return Response({"error": "OTP expired"}, status=400)

        user.is_verified = True
        password = request.data.get("password") 
    
        user.set_password(password) 
    
        user.is_active = True 
        user.save()
    
        return Response({"message": "Activated. Now you can login."})

class DepartmentView(APIView):
    def post(self,request):
        serializer = DepartmentSerializer(data =request.data)

        if serializer.is_valid():
            serializer.save() 
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)     

              


class LoginAPIView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = LoginSerializers(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data 
            refresh = RefreshToken.for_user(user)

            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                'role': user.role, 
                'role_display': user.get_role_display(),
                'username': user.username,
                'profile_pic': user.profile_picture.url if user.profile_picture else None,
                "message": "Login successful"
            }, status=status.HTTP_200_OK)
           

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            return Response({"message": "Successfully logged out"}, status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response({"error": "Invalid or missing refresh token"}, status=status.HTTP_400_BAD_REQUEST)


class ResendOTPView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            if user.is_verified and user.is_active:
                return Response({"message": "Account is already active. Please login."}, status=status.HTTP_400_BAD_REQUEST)

            otp = generate_otp()
            user.otp = otp
            user.otp_created_at = timezone.now()
            user.save()

            # 3. Send Email (This prints to your console terminal)
            Util.send_email(user, otp)

            return Response({
                "message": "A new OTP has been sent to your email."
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({"error": "No user found with this email."}, status=status.HTTP_404_NOT_FOUND)






class RequestPasswordResetEmailView(APIView):
    def post(self, request):
        email = request.data.get('email')
        user = User.objects.filter(email=email).first()

        if user:
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            token = PasswordResetTokenGenerator().make_token(user)
            
            reset_url = f"http://localhost:5173/password-reset/{uidb64}/{token}/"
            
            subject = "Password Reset Request"
            message = f"Hello {user.username},\n\nClick the link below to reset your password:\n{reset_url}\n\nIf you did not request this, ignore this email."
            email_from = settings.EMAIL_HOST_USER
            recipient_list = [email]

            try:
                send_mail(subject, message, email_from, recipient_list)
            except Exception as e:
                return Response({"error": "Failed to send email"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(
            {"message": "If an account exists with this email, a reset link has been sent."}, 
            status=status.HTTP_200_OK
        )
class PasswordResetConfirmView(APIView):
    def post(self, request):
        uidb64 = request.data.get('uidb64')
        token = request.data.get('token')
        password = request.data.get('password')

        try:
            id = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=id)

            if not PasswordResetTokenGenerator().check_token(user, token):
                return Response({"error": "Token is invalid or expired"}, status=status.HTTP_401_UNAUTHORIZED)

            user.set_password(password)
            user.save()

            return Response({"message": "Password reset successful"}, status=status.HTTP_200_OK)

        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"error": "Invalid link"}, status=status.HTTP_400_BAD_REQUEST)