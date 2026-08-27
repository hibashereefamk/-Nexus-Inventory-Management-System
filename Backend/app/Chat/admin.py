from django.contrib import admin

from .models import (
    Conversation,
    ConversationMember,
    Message
)


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):

    list_display = [
        "id",
        "conversation_type",
        "name",
        "created_by",
        "created_at",
    ]


@admin.register(ConversationMember)
class ConversationMemberAdmin(admin.ModelAdmin):

    list_display = [
        "conversation",
        "user",
        "joined_at",
        "is_muted",
    ]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):

    list_display = [
        "id",
        "conversation",
        "sender",
        "message_type",
        "created_at",
    ]