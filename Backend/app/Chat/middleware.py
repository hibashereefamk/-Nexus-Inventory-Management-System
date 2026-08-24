from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware

from django.contrib.auth.models import AnonymousUser

from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken

from app.accounts.models import User


class JWTAuthMiddleware(BaseMiddleware):

    async def __call__(self, scope, receive, send):

        # Default user
        scope["user"] = AnonymousUser()

        try:

            # Get query string
            query_string = scope.get(
                "query_string",
                b""
            ).decode()

            # Convert query string into dictionary
            query_params = parse_qs(query_string)

            # Get token
            token_list = query_params.get("token")

            if not token_list:
                return await super().__call__(
                    scope,
                    receive,
                    send
                )

            token = token_list[0]

            # Validate JWT
            access_token = AccessToken(token)

            # Get user ID from JWT
            user_id = access_token.get("user_id")

            if not user_id:
                return await super().__call__(
                    scope,
                    receive,
                    send
                )

            # Get user from database
            user = await self.get_user(user_id)

            if user:
                scope["user"] = user

        except InvalidToken:

            print("Invalid WebSocket JWT token")

        except Exception as e:

            print("WebSocket authentication error:", e)

        return await super().__call__(
            scope,
            receive,
            send
        )


    @database_sync_to_async
    def get_user(self, user_id):

        try:

            return User.objects.get(
                id=user_id,
                is_active=True
            )

        except User.DoesNotExist:

            return None