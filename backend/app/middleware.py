"""Request body size limits, applied before any route (or authentication) reads the body."""

import re

from fastapi import HTTPException
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
