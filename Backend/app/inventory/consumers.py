# app/inventory/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        # Group users by department or role
        self.group_name = f"dept_{self.user.department.id}" if self.user.department else "global_alerts"
        
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # Method to receive messages from the channel layer and send to WebSocket
    async def send_alert(self, event):
        await self.send(text_data=json.dumps(event["message"]))