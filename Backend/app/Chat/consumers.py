import json

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

from .models import (
    Conversation,
    ConversationMember,
    Message
)


class ChatConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):

        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close()
            return

        self.conversation_id = (
            self.scope["url_route"]["kwargs"][
                "conversation_id"
            ]
        )

        self.room_group_name = (
            f"chat_{self.conversation_id}"
        )

        is_member = await self.check_membership()

        if not is_member:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()


    async def disconnect(self, close_code):

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )


    # =====================================================
    # RECEIVE
    # =====================================================


    async def receive_json(self, content, **kwargs):

        message_type = content.get("type")


    # =====================================================
    # NORMAL MESSAGE
    # =====================================================

        if message_type == "message":

            message_text = content.get(
            "message"
        )

            if not message_text:
                return

            message = await self.create_message(
                message_text
        )

            await self.channel_layer.group_send(

                self.room_group_name,

            {
                "type":
                    "chat_message",

                "message_id":
                    message["id"],

                "conversation_id":
                    message["conversation_id"],

                "sender_id":
                    message["sender_id"],

                "sender_name":
                    message["sender_name"],

                "message":
                    message["content"],

                "message_type":
                    message["message_type"],

                "created_at":
                    message["created_at"],
            }
        )

            return


    # =====================================================
    # EDIT MESSAGE
    # =====================================================

        if message_type == "edit_message":

            message_id = content.get(
            "message_id"
        )

            new_content = content.get(
            "content"
        )

            if not message_id or not new_content:
                return

            result = await self.edit_message(
            message_id,
            new_content
        )

            if not result:
                return

            await self.channel_layer.group_send(

            self.room_group_name,

            {
                "type":
                    "message_edited",

                "message_id":
                    result["id"],

                "content":
                    result["content"],

                "updated_at":
                    result["updated_at"],
            }
        )

            return


    # =====================================================
    # DELETE MESSAGE
    # =====================================================

        if message_type == "delete_message":

            message_id = content.get(
            "message_id"
        )

            if not message_id:
                return

            result = await self.delete_message(
            message_id
        )

            if not result:
                return

            await self.channel_layer.group_send(

                self.room_group_name,

             {
        "type": "message_deleted",

        "message_id":
            result["id"],

        "deleted_at":
            result["updated_at"],
    }
        )

            return


    # =====================================================
    # CALL OFFER
    # =====================================================

        if message_type == "call_offer":

            await self.channel_layer.group_send(

            self.room_group_name,

            {
                "type":
                    "call_offer",

                "call_id":
                    content.get("call_id"),

                "caller_id":
                    self.user.id,

                "receiver_id":
                    content.get("receiver_id"),

                "offer":
                    content.get("offer"),

                "call_type":
                    content.get("call_type"),
            }
        )

            return


    # =====================================================
    # CALL ANSWER
    # =====================================================

        if message_type == "call_answer":

            await self.channel_layer.group_send(

            self.room_group_name,

            {
                "type":
                    "call_answer",

                "call_id":
                    content.get("call_id"),

                "caller_id":
                    content.get("caller_id"),

                "receiver_id":
                    self.user.id,

                "answer":
                    content.get("answer"),
            }
        )

            return


    # =====================================================
    # ICE CANDIDATE
    # =====================================================

        if message_type == "ice_candidate":

            await self.channel_layer.group_send(

            self.room_group_name,

            {
                "type":
                    "ice_candidate",

                "call_id":
                    content.get("call_id"),

                "sender_id":
                    self.user.id,

                "receiver_id":
                    content.get("receiver_id"),

                "candidate":
                    content.get("candidate"),
            }
        )

            return


    # =====================================================
    # CALL REJECTED
    # =====================================================

        if message_type == "call_rejected":

            await self.channel_layer.group_send(

            self.room_group_name,

            {
                "type":
                    "call_rejected",

                "call_id":
                    content.get("call_id"),

                "sender_id":
                    self.user.id,

                "receiver_id":
                    content.get("receiver_id"),
            }
        )

            return


    # =====================================================
    # CALL ENDED
    # =====================================================

        if message_type == "call_ended":

            await self.channel_layer.group_send(

            self.room_group_name,

            {
                "type":
                    "call_ended",

                "call_id":
                    content.get("call_id"),

                "sender_id":
                    self.user.id,

                "receiver_id":
                    content.get("receiver_id"),
            }
        )

        return


    # =====================================================
    # NEW MESSAGE EVENT
    # =====================================================

    async def chat_message(self, event):

        await self.send_json({

            "type": "message",

            "id":
                event["message_id"],

            "conversation":
                event["conversation_id"],

            "sender":
                event["sender_id"],

            "sender_name":
                event["sender_name"],

            "message_type":
                event["message_type"],

            "content":
                event["message"],

            "created_at":
                event["created_at"],
        })

    async def chat_attachment(self,event):

        await self.send_json({

        "type":
            "attachment",

        "id":
            event["message_id"],

        "conversation":
            event["conversation_id"],

        "sender":
            event["sender_id"],

        "sender_name":
            event["sender_name"],

        "message_type":
            event["message_type"],

        "content":
            event["content"],

        "file_url":
            event["file_url"],

        "file_name":
            event["file_name"],

        "file_size":
            event["file_size"],

        "created_at":
            event["created_at"],

            "is_edited": event.get(
            "is_edited",
            False
        ),

        "is_deleted": event.get(
            "is_deleted",
            False
        ),
    
    })
        
    # =====================================================
    # EDIT EVENT
    # =====================================================

    async def message_edited(self, event):

        await self.send_json({

            "type":
                "message_edited",

            "message_id":
                event["message_id"],

            "content":
                event["content"],

            "updated_at":
                event["updated_at"],

        })


    # =====================================================
    # DELETE EVENT
    # =====================================================

    async def message_deleted(self, event):

        await self.send_json({

            "type":
                "message_deleted",

            "message_id":
                event["message_id"],

            "deleted_at":
                event["deleted_at"],

        })


    # =====================================================
    # CHECK MEMBERSHIP
    # =====================================================

    @database_sync_to_async
    def check_membership(self):

        return ConversationMember.objects.filter(

            conversation_id=
                self.conversation_id,

            user=self.user

        ).exists()


    # =====================================================
    # CREATE
    # =====================================================

    @database_sync_to_async
    def create_message(self, content):

        message = Message.objects.create(

            conversation_id=
                self.conversation_id,

            sender=self.user,

            message_type="TEXT",

            content=content

        )

        return {

            "id":
                message.id,

            "conversation_id":
                message.conversation_id,

            "sender_id":
                message.sender_id,

            "sender_name":
                message.sender.username,

            "content":
                message.content,

            "message_type":
                message.message_type,

            "created_at":
                message.created_at.isoformat(),

        }
    

    # =====================================================
    # EDIT
    # =====================================================

    @database_sync_to_async
    def edit_message(
        self,
        message_id,
        new_content
    ):

        try:

            message = Message.objects.get(

                id=message_id,

                conversation_id=
                    self.conversation_id,

                sender=self.user,

                is_deleted=False

            )

        except Message.DoesNotExist:

            return None


        message.content = new_content

        message.is_edited = True

        message.save(
            update_fields=[
                "content",
                "is_edited",
                "updated_at"
            ]
        )


        return {

            "id":
                message.id,

            "content":
                message.content,

            "updated_at":
                message.updated_at.isoformat(),

        }


    # =====================================================
    # DELETE
    # =====================================================

    @database_sync_to_async
    def delete_message(
        self,
        message_id
    ):

        try:

            message = Message.objects.get(

                id=message_id,

                conversation_id=
                    self.conversation_id,

                sender=self.user,

                is_deleted=False

            )

        except Message.DoesNotExist:

            return None


        message.is_deleted = True

        message.content = None

        message.save(
            update_fields=[
                "is_deleted",
                "content",
                "updated_at"
            ]
        )


        return {

            "id":
                message.id,

            "updated_at":
                message.updated_at.isoformat(),

        }
    async def call_offer(self, event):

    # Don't send caller's offer back to caller

        if event["caller_id"] == self.user.id:
            return

    # Only receiver gets the offer

        if event["receiver_id"] != self.user.id:
            return

        await self.send_json({

        "type":
            "call_offer",

        "call_id":
            event["call_id"],

        "caller_id":
            event["caller_id"],

        "receiver_id":
            event["receiver_id"],

        "offer":
            event["offer"],

        "call_type":
            event["call_type"],
    })


    async def call_answer(self, event):

        if event["caller_id"] != self.user.id:
            return

        await self.send_json({

        "type":
            "call_answer",

        "call_id":
            event["call_id"],

        "answer":
            event["answer"],

        "receiver_id":
            event["receiver_id"],
    })
    async def ice_candidate(self, event):

        if event["receiver_id"] != self.user.id:
            return

        await self.send_json({

        "type":
            "ice_candidate",

        "call_id":
            event["call_id"],

        "sender_id":
            event["sender_id"],

        "candidate":
            event["candidate"],
    })

    async def call_rejected(self, event):

        if event["receiver_id"] != self.user.id:
            return

        await self.send_json({

        "type":
            "call_rejected",

        "call_id":
            event["call_id"],

        "sender_id":
            event["sender_id"],
    })


    async def call_ended(self, event):

        if event["receiver_id"] != self.user.id:
            return

        await self.send_json({

        "type":
            "call_ended",

        "call_id":
            event["call_id"],

        "sender_id":
            event["sender_id"],
    })