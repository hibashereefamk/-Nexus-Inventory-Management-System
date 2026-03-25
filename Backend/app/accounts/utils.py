import random
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings

def generate_otp():
    return str(random.randint(100000, 999999))


def is_otp_expired(otp_created, minutes=5):
    if otp_created is None:
        return True
    return (timezone.now() - otp_created).total_seconds() > minutes * 60



class Util:
    @staticmethod
    def send_email(user, otp):
        subject = "Your OTP Verification Code"
        message = f"Hello {user.username}, your OTP is {otp}"
        email_from = settings.EMAIL_HOST_USER
        recipient_list = [user.email]

        send_mail(subject, message, email_from, recipient_list)