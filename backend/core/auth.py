import base64
import hashlib
import hmac
import json
import time

from django.conf import settings
from rest_framework.response import Response
from rest_framework import status


def _sign(payload_json: str) -> str:
    secret = (settings.API_TOKEN_SECRET or settings.SECRET_KEY).encode("utf-8")
    signature = hmac.new(secret, payload_json.encode("utf-8"), hashlib.sha256).hexdigest()
    return signature


def generate_token(email: str, ttl_seconds: int = None) -> str:
    ttl = ttl_seconds or settings.AUTH_TOKEN_TTL_SECONDS
    payload = {"email": email, "exp": int(time.time()) + int(ttl)}
    payload_json = json.dumps(payload, separators=(",", ":"), sort_keys=True)
    signature = _sign(payload_json)
    token = base64.urlsafe_b64encode(f"{payload_json}.{signature}".encode("utf-8")).decode("utf-8")
    return token


def verify_token(token: str):
    try:
        decoded = base64.urlsafe_b64decode(token.encode("utf-8")).decode("utf-8")
        payload_json, signature = decoded.rsplit(".", 1)
        expected = _sign(payload_json)
        if not hmac.compare_digest(signature, expected):
            return None
        payload = json.loads(payload_json)
        if payload.get("exp", 0) < int(time.time()):
            return None
        return payload.get("email")
    except Exception:
        return None


def require_api_auth(view_func):
    def wrapped(request, *args, **kwargs):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
        token = auth_header.split(" ", 1)[1].strip()
        email = verify_token(token)
        if not email:
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
        request.auth_email = email
        return view_func(request, *args, **kwargs)

    return wrapped
