# backend/celery_app.py
from celery import Celery

app = Celery("spotify_newsletter", broker="redis://localhost:6379/0")
