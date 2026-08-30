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

from rest_framework import serializers

from .models import (
    Conversation,
    ConversationMember,
    Message,
)


class MessageSerializer(serializers.ModelSerializer):

    sender_name = serializers.CharField(
        source="sender.username",
        read_only=True
    )

    sender_id = serializers.IntegerField(
        source="sender.id",
        read_only=True
    )

    file_url = serializers.SerializerMethodField()

    class Meta:

        model = Message

        fields = [
            "id",
            "conversation",
            "sender",
            "sender_id",
            "sender_name",

            "message_type",
            "content",

            "file",
            "file_url",
            "file_name",
            "file_size",

            "reply_to",

            "is_edited",
            "is_deleted",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "sender",
            "sender_id",
            "sender_name",
            "file_url",
            "created_at",
            "updated_at",
        ]

    def get_file_url(self, obj):

        if not obj.file:
            return None

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(
                obj.file.url
            )

        return obj.file.url



from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Call


User = get_user_model()


class CallSerializer(serializers.ModelSerializer):

    caller_name = serializers.CharField(
        source="caller.username",
        read_only=True
    )

    receiver_name = serializers.CharField(
        source="receiver.username",
        read_only=True
    )

    class Meta:

        model = Call

        fields = [
            "id",

            "conversation",

            "caller",
            "caller_name",

            "receiver",
            "receiver_name",

            "call_type",

            "status",

            "started_at",
            "ended_at",

            "duration",

            "created_at",
        ]

        read_only_fields = [
            "id",
            "caller",
            "caller_name",
            "receiver_name",
            "status",
            "started_at",
            "ended_at",
            "duration",
            "created_at",
        ]