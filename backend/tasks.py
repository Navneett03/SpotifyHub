# backend/tasks.py
from celery_app import app
from fetch_and_store import fetch_all_users_data
from update_weekly import main as update_weekly_main
from send_newsletter import send_all_newsletters
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.task
def weekly_job():
    print("Starting weekly update and newsletter distribution...")
    fetch_all_users_data()
    update_weekly_main()
    send_all_newsletters()
    print("Weekly update and newsletter distribution completed.")


@app.task
def daily_fetch_task():
    logger.info("Starting daily data fetch for all users...")
    fetch_all_users_data()
    logger.info("Daily data fetch completed.")


@app.task
def weekly_update_task():
    logger.info("Starting weekly update for all users...")
    update_weekly_main()
    logger.info("Weekly update completed.")
