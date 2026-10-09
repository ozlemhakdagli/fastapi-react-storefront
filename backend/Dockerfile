# Backend image: FastAPI served by uvicorn.
#
# Not yet tested with Docker. Read "Running with Docker" in the README before you rely on it, and
# please report what you had to change.

FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# The pinned packages first, so this layer is reused until requirements.txt changes.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY migrations ./migrations
COPY seed.py ./

# Run as a normal user. /app/uploads is a volume (see compose.yml) that this user can write to.
RUN useradd --system --create-home appuser \
    && mkdir -p /app/uploads \
    && chown appuser /app/uploads
USER appuser

EXPOSE 8000

# Apply the migrations, then start the API. DATABASE_URL points at the "db" service in compose.yml.
CMD ["sh", "-c", "python -m app.migrate && exec uvicorn app.main:create_app --factory --host 0.0.0.0 --port 8000"]
