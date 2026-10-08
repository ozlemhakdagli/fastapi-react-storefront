import jwt
import pytest

from app.config import get_settings
from app.errors import ApiError
from app.security import (
    DUMMY_HASH,
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)

SECRET_KEY = "0123456789abcdef" * 4  # 64 characters
PASSWORD = "Passw0rd!x"


@pytest.fixture
def settings_env(monkeypatch, tmp_path):
    # An empty working directory means no backend/.env is found, whether or not one exists.
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("DATABASE_URL", "postgresql://ecommerce:ecommerce@localhost:5432/ecommerce")
    monkeypatch.setenv("SECRET_KEY", SECRET_KEY)
    monkeypatch.delenv("ACCESS_TOKEN_MINUTES", raising=False)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_hash_is_argon2_and_verifies():
    hashed = hash_password(PASSWORD)

    assert hashed.startswith("$argon2")
    assert hashed != PASSWORD
    assert verify_password(PASSWORD, hashed) is True
    assert verify_password("Wrong-password-1", hashed) is False
    assert hash_password(PASSWORD) != hashed


def test_dummy_hash_is_argon2_and_never_matches_a_real_password():
    assert DUMMY_HASH.startswith("$argon2")
    assert verify_password(PASSWORD, DUMMY_HASH) is False


def test_token_round_trip(settings_env):
    token = create_access_token(42)

    assert decode_access_token(token) == 42
    assert jwt.get_unverified_header(token)["alg"] == "HS256"
    claims = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    assert claims["sub"] == "42"
    assert {"iat", "exp"}.issubset(claims)


def test_expired_token_rejected(settings_env):
    token = create_access_token(1, minutes=-1)

    with pytest.raises(ApiError) as exc_info:
        decode_access_token(token)

    assert exc_info.value.status_code == 401
    assert exc_info.value.code == "unauthorized"


def test_tampered_and_garbage_tokens_rejected(settings_env):
    token = create_access_token(42)
    # Replace the final character with a different one so the signature really changes.
    tampered = token[:-1] + ("A" if token[-1] != "A" else "B")

    for bad_token in (tampered, "abc"):
        with pytest.raises(ApiError) as exc_info:
            decode_access_token(bad_token)
        assert exc_info.value.status_code == 401
        assert exc_info.value.code == "unauthorized"
