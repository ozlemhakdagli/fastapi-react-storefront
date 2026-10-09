import pytest
from pydantic import ValidationError

from app.config import Settings, get_settings

DATABASE_URL = "postgresql://ecommerce:ecommerce@localhost:5432/ecommerce"
SECRET_KEY = "0123456789abcdef" * 4  # 64 characters

# Every variable Settings reads. They are cleared so a developer's shell never changes a test.
SETTINGS_ENV_NAMES = (
    "DATABASE_URL",
    "SECRET_KEY",
    "ACCESS_TOKEN_MINUTES",
    "CORS_ORIGINS",
    "UPLOAD_DIR",
    "MAX_UPLOAD_BYTES",
    "API_DOCS_ENABLED",
)


@pytest.fixture
def clean_env(monkeypatch, tmp_path):
    # An empty working directory means no backend/.env is found, whether or not one exists.
    monkeypatch.chdir(tmp_path)
    for name in SETTINGS_ENV_NAMES:
        monkeypatch.delenv(name, raising=False)
    get_settings.cache_clear()
    yield monkeypatch
    get_settings.cache_clear()


def test_settings_reads_environment(clean_env):
    clean_env.setenv("DATABASE_URL", DATABASE_URL)
    clean_env.setenv("SECRET_KEY", SECRET_KEY)

    settings = Settings()

    assert settings.database_url == DATABASE_URL
    assert settings.secret_key == SECRET_KEY
    assert settings.access_token_minutes == 60
    assert settings.max_upload_bytes == 2_000_000


def test_secret_key_must_be_long_and_not_a_placeholder(clean_env):
    clean_env.setenv("DATABASE_URL", DATABASE_URL)

    clean_env.setenv("SECRET_KEY", "x" * 31)
    with pytest.raises(ValidationError):
        Settings()

    clean_env.setenv("SECRET_KEY", SECRET_KEY)
    assert Settings().secret_key == SECRET_KEY

    clean_env.setenv("SECRET_KEY", "change-me-" + "x" * 40)
    with pytest.raises(ValidationError) as exc_info:
        Settings()
    assert "change-me" not in str(exc_info.value)


def test_cors_origins_parsed_from_comma_separated_string(clean_env):
    clean_env.setenv("DATABASE_URL", DATABASE_URL)
    clean_env.setenv("SECRET_KEY", SECRET_KEY)
    clean_env.setenv("CORS_ORIGINS", "http://a,http://b")

    assert Settings().cors_origins == ["http://a", "http://b"]


def test_settings_reads_dotenv_and_ignores_unknown_keys(clean_env, tmp_path):
    (tmp_path / ".env").write_text(
        f"DATABASE_URL={DATABASE_URL}\n"
        f"SECRET_KEY={SECRET_KEY}\n"
        "ADMIN_EMAIL=admin@example.com\n"
        "ADMIN_PASSWORD=not-a-real-password\n",
        encoding="utf-8",
    )

    settings = Settings()

    assert settings.database_url == DATABASE_URL
    assert settings.secret_key == SECRET_KEY


def test_secret_key_must_not_be_a_repeated_character(clean_env):
    clean_env.setenv("DATABASE_URL", DATABASE_URL)
    for weak in ("x" * 40, "ab" * 20, "password" * 5):
        clean_env.setenv("SECRET_KEY", weak)
        with pytest.raises(ValidationError):
            Settings()


def test_cors_origins_reject_a_wildcard(clean_env):
    clean_env.setenv("DATABASE_URL", DATABASE_URL)
    clean_env.setenv("SECRET_KEY", SECRET_KEY)
    for value in ("*", "http://a,*"):
        clean_env.setenv("CORS_ORIGINS", value)
        with pytest.raises(ValidationError):
            Settings()


def test_token_lifetime_has_sane_bounds(clean_env):
    clean_env.setenv("DATABASE_URL", DATABASE_URL)
    clean_env.setenv("SECRET_KEY", SECRET_KEY)
    for minutes in ("0", "-5", "1441", "5256000"):
        clean_env.setenv("ACCESS_TOKEN_MINUTES", minutes)
        with pytest.raises(ValidationError):
            Settings()
    clean_env.setenv("ACCESS_TOKEN_MINUTES", "1440")
    assert Settings().access_token_minutes == 1440


def test_api_docs_are_off_unless_enabled(clean_env):
    clean_env.setenv("DATABASE_URL", DATABASE_URL)
    clean_env.setenv("SECRET_KEY", SECRET_KEY)
    assert Settings().api_docs_enabled is False
    clean_env.setenv("API_DOCS_ENABLED", "true")
    assert Settings().api_docs_enabled is True
