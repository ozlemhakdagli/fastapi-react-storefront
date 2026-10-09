from app.repositories.like import like_pattern


def test_like_pattern_finds_the_term_anywhere() -> None:
    assert like_pattern("ssd") == "%ssd%"


def test_like_pattern_escapes_wildcards_and_the_escape_character() -> None:
    assert like_pattern("50%_a\\b") == "%50\\%\\_a\\\\b%"
