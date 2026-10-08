from fastapi import Request
from fastapi.responses import JSONResponse


class ApiError(Exception):
    """An expected failure, rendered as {"detail": code, **extra} with an HTTP status."""

    def __init__(self, status_code: int, code: str, **extra: object) -> None:
        super().__init__(code)
        self.status_code = status_code
        self.code = code
        self.extra = extra


async def api_error_handler(request: Request, exc: ApiError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.code, **exc.extra},
    )
