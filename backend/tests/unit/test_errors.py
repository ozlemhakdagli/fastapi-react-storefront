from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.errors import ApiError, api_error_handler


def test_api_error_handler_body():
    app = FastAPI()
    app.add_exception_handler(ApiError, api_error_handler)

    @app.get("/conflict")
    def conflict() -> None:
        raise ApiError(409, "insufficient_stock", product_id=7)

    response = TestClient(app).get("/conflict")

    assert response.status_code == 409
    assert response.json() == {"detail": "insufficient_stock", "product_id": 7}
