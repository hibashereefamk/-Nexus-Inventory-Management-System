import os
import django

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

from app.inventory.routing import (
    websocket_urlpatterns as inventory_websocket_urlpatterns
)

from app.Chat.routing import (
    websocket_urlpatterns as chat_websocket_urlpatterns
)

from app.Chat.middleware import JWTAuthMiddleware


os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "NexusInventory.settings"
)

django.setup()

django_asgi_app = get_asgi_application()


application = ProtocolTypeRouter({

    "http": django_asgi_app,

    "websocket": JWTAuthMiddleware(
        URLRouter(
            inventory_websocket_urlpatterns
            + chat_websocket_urlpatterns
        )
    ),

})