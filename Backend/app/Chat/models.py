from django.db import models
from django.conf import settings


class Conversation(models.Model):

    CONVERSATION_TYPES = (
        ("DIRECT", "Direct"),
        ("GROUP", "Group"),
        ("TEAM", "Team"),
    )

    conversation_type = models.CharField(
        max_length=20,
        choices=CONVERSATION_TYPES,
        default="DIRECT"
    )

    name = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_conversations"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name or f"Conversation {self.id}"


class ConversationMember(models.Model):

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="members"
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_memberships"
    )

    joined_at = models.DateTimeField(auto_now_add=True)

    is_muted = models.BooleanField(default=False)

    last_read_message = models.ForeignKey(
        "Message",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+"
    )

    class Meta:
        unique_together = ("conversation", "user")

    def __str__(self):
        return f"{self.user} - {self.conversation}"


class Message(models.Model):

    MESSAGE_TYPES = (
        ("TEXT", "Text"),
        ("IMAGE", "Image"),
        ("VIDEO", "Video"),
        ("FILE", "File"),
        ("VOICE", "Voice"),
        ("SYSTEM", "System"),
    )

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages"
    )

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages"
    )

    message_type = models.CharField(
        max_length=20,
        choices=MESSAGE_TYPES,
        default="TEXT"
    )

    content = models.TextField(
        blank=True,
        null=True
    )

    reply_to = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="replies"
    )

    is_edited = models.BooleanField(default=False)

    is_deleted = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.sender} - {self.content[:30]}"