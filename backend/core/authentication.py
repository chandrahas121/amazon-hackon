from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings


class CookieJWTAuthentication(JWTAuthentication):
    """
    Read the JWT access token from an httpOnly cookie instead of
    the Authorization header.  Falls back to header if cookie is absent.
    """

    def authenticate(self, request):
        cookie_name = settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token')
        raw_token = request.COOKIES.get(cookie_name)
        if raw_token is None:
            # Fall back to header-based auth (useful for API testing / Postman)
            return super().authenticate(request)
        validated = self.get_validated_token(raw_token)
        return self.get_user(validated), validated
