# backend/celery_config.py
from celery_app import app
from celery.schedules import crontab

# Celery configuration
app.conf.update(
    result_backend="redis://localhost:6379/0",
    timezone="Asia/Kolkata",

    beat_schedule={
        "send-weekly-newsletter": {
            "task": "tasks.weekly_job",  # Reference task by name
            # "schedule": crontab(minute="*"),  # Monday at 9 AM
             'schedule': crontab(hour=17, minute=51, day_of_week=6),  # Monday at 10 AM
        },
        "fetch-all-users-data-daily": {
            "task": "tasks.daily_fetch_task",
            "schedule": crontab(hour=17, minute=38),  # Run daily at midnight UTC
        },
        "update-weekly-stats": {
            "task": "tasks.weekly_update_task",
            "schedule": crontab(
                hour=17, minute=41, day_of_week=6
            ),  # Monday at 9:50 AM UTC
        },
    },
    broker_connection_retry_on_startup=True,
)

# Import tasks to register them with the app
import tasks  # This ensures tasks.py is loaded and tasks are registered
