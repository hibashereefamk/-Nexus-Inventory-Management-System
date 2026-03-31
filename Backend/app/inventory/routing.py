from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # This defines the URL as ws://127.0.0.1:8000/ws/notifications/
    re_path(r'ws/notifications/$', consumers.InventoryConsumer.as_view()),
]