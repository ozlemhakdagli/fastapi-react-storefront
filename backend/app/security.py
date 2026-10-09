import secrets
from datetime import UTC, datetime, timedelta

import jwt
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher

from app.config import get_settings
from app.errors import ApiError

_ALGORITHM = "HS256"
_password_hash = PasswordHash((Argon2Hasher(),))


def hash_password(plain: str) -> str:
    return _password_hash.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return _password_hash.verify(plain, hashed)


# Verified against when a login names an unknown email, so that path costs the same Argon2 work.
DUMMY_HASH: str = hash_password(secrets.token_urlsafe(32))


def create_access_token(user_id: int, token_version: int, minutes: int | None = None) -> str:
    settings = get_settings()
    lifetime_minutes = settings.access_token_minutes if minutes is None else minutes
    now = datetime.now(UTC)
    claims = {
        "sub": str(user_id),
        "tv": token_version,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=lifetime_minutes)).timestamp()),
    }
    return jwt.encode(claims, settings.secret_key, algorithm=_ALGORITHM)


def decode_access_token(token: str) -> tuple[int, int]:
    """The user id and the token version of a valid token. Any other token raises 401."""
    settings = get_settings()
    try:
        claims = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[_ALGORITHM],
            options={"require": ["sub", "iat", "exp", "tv"]},
        )
        user_id, token_version = int(claims["sub"]), claims["tv"]
    except jwt.InvalidTokenError, ValueError:
        raise ApiError(401, "unauthorized") from None
    # bool is a subclass of int, and a JSON float or string is not a version.
    valid = isinstance(token_version, int) and not isinstance(token_version, bool)
    if not valid or token_version < 0:
        raise ApiError(401, "unauthorized")
    return user_id, token_version
