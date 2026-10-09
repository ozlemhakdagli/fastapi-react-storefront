"""Request body limits and response headers, applied around every route."""

import re

from fastapi import HTTPException
from starlette.datastructures import MutableHeaders
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

# Every JSON body of this API is far smaller than this (the longest text is 20 000 characters).
DEFAULT_LIMIT = 256 * 1024
# Multipart overhead on top of the largest allowed image.
UPLOAD_OVERHEAD = 64 * 1024

_UPLOAD_PATH = re.compile(r"^/api/admin/products/[0-9]+/images$")
_BODYLESS_METHODS = {"GET", "HEAD", "OPTIONS", "DELETE"}


class BodySizeLimitMiddleware:
    """Answer 413 when a request body is larger than the limit of its route.

    A declared Content-Length is checked before the application starts. A body that arrives
    without one (chunked) is counted while it is read, and the read fails with a 413 as soon as the
    limit is passed. Only the image upload route may be larger, up to `upload_limit`.
    """

    def __init__(self, app: ASGIApp, *, upload_limit: int) -> None:
        self.app = app
        self.upload_limit = upload_limit

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope["method"] in _BODYLESS_METHODS:
            await self.app(scope, receive, send)
            return

        is_upload = scope["method"] == "POST" and _UPLOAD_PATH.match(scope["path"])
        limit = self.upload_limit if is_upload else DEFAULT_LIMIT

        declared = dict(scope["headers"]).get(b"content-length", b"")
        if declared.isdigit() and int(declared) > limit:
            response = JSONResponse({"detail": "payload_too_large"}, status_code=413)
            await response(scope, receive, send)
            return

        received = 0

        async def limited_receive() -> Message:
            nonlocal received
            message = await receive()
            if message["type"] == "http.request":
                received += len(message.get("body", b""))
                if received > limit:
                    # Raised inside the application, so its error handlers render the 413.
                    raise HTTPException(status_code=413, detail="payload_too_large")
            return message

        await self.app(scope, limited_receive, send)


# Uploaded files are named by a random UUID and never overwritten (services/images.py).
_UPLOADED_FILE = re.compile(r"^[0-9a-f]{32}(-sm)?\.(webp|jpe?g|png)$")
_MEDIA_PREFIX = "/api/media/"


class SecurityHeadersMiddleware:
    """Add nosniff to every answer, the API headers to API answers and caching to media files.

    A browser may keep an uploaded file for a year, because its name never comes back with other
    content. The shared placeholder is kept for a day. Media errors (a 404) are never cached.
    """

    def __init__(self, app: ASGIApp, *, exempt_paths: frozenset[str]) -> None:
        self.app = app
        self.exempt_paths = exempt_paths

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        path: str = scope["path"]

        async def send_with_headers(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                headers["X-Content-Type-Options"] = "nosniff"
                if path.startswith(_MEDIA_PREFIX):
                    if message["status"] in (200, 304):
                        name = path.rsplit("/", 1)[-1]
                        headers["Cache-Control"] = (
                            "public, max-age=31536000, immutable"
                            if _UPLOADED_FILE.match(name)
                            else "public, max-age=86400"
                        )
                elif path.startswith("/api/") and path not in self.exempt_paths:
                    headers["X-Frame-Options"] = "DENY"
                    headers["Referrer-Policy"] = "no-referrer"
                    headers["Cache-Control"] = "no-store"
            await send(message)

        await self.app(scope, receive, send_with_headers)
