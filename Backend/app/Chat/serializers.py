from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Conversation, ConversationMember,Message


User = get_user_model()


class EmployeeSearchSerializer(serializers.ModelSerializer):

    department_name = serializers.SerializerMethodField()

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "email",
            "role",
            "profile_picture",
            "department_name",
        ]

    def get_department_name(self, obj):

        if obj.department:
            return obj.department.name

        return None


class ConversationSerializer(serializers.ModelSerializer):

    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation

        fields = [
            "id",
            "conversation_type",
            "name",
            "other_user",
            "last_message",
            "created_at",
            "updated_at",
        ]

    def get_other_user(self, obj):

        request = self.context.get("request")

        if not request:
            return None

        member = (
            obj.members
            .select_related("user")
            .exclude(user=request.user)
            .first()
        )

        if not member:
            return None

        return {
            "id": member.user.id,
            "username": member.user.username,
        }

    def get_last_message(self, obj):

        message = (
            obj.messages
            .select_related("sender")
            .order_by("-created_at")
            .first()
        )

        if not message:
            return None

        return {
            "id": message.id,
            "content": message.content,
            "sender_id": message.sender.id,
            "sender_name": message.sender.username,
            "message_type": message.message_type,
            "created_at": message.created_at,
        }


class MesaageSerializer(serializers.ModelSerializer):
    sender_name =serializers.CharField(source ="sender.username", read_only =True)
    class Meta :
        model =Message
        fields =[
            "id",
            "conversation",
            "sender",
            "sender_name",
            "message_type",
            "content",
            "reply_to",
            "is_edited",
            "is_deleted",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "sender",
            "sender_name",
            "created_at",
            "updated_at",
        ]