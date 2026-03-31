# consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer
import json

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        print("WebSocket Connected")

    async def disconnect(self, close_code):
        print("WebSocket Disconnected")

    async def receive(self, text_data):
        await self.send(text_data=json.dumps({
            "message": "Hello from server"
        }))