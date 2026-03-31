"""
ASGI config for NexusInventory project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/
"""
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import app.inventory.routing  # Import the routing we just made

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'NexusInventory.settings')

application = ProtocolTypeRouter({
    # Handles standard HTTP requests
    "http": get_asgi_application(),
    
    # Handles WebSocket connections
    "websocket": AuthMiddlewareStack(
        URLRouter(
            app.inventory.routing.websocket_urlpatterns
        )
    ),
})