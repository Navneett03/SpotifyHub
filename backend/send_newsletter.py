import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
import json
from datetime import datetime, timedelta
from db import get_db_connection
from config import EMAIL_USER, EMAIL_PASSWORD, SMTP_SERVER, SMTP_PORT
import logging
import os
import sys
from zoneinfo import ZoneInfo


# Use Indian Standard Time directly
today = datetime.now(ZoneInfo("Asia/Kolkata"))
current_weekday = today.weekday()
last_monday = today - timedelta(days=current_weekday + 7)
last_sunday = last_monday + timedelta(days=6)


# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def generate_newsletter_content(user_id, email):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Get user info
        cursor.execute("SELECT display_name FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        display_name = user["display_name"] if user else "Spotify Listener"

        # Get weekly stats
        one_week_ago = datetime.now(ZoneInfo("Asia/Kolkata")) - timedelta(days=7)


        # Top tracks this week
        cursor.execute(
            """
            SELECT track_name, artist_name, COUNT(*) as play_count
            FROM recent_tracks
            WHERE user_id = %s AND played_at >= %s
            GROUP BY track_id, track_name, artist_name
            ORDER BY play_count DESC
            LIMIT 5
        """,
            (user_id, one_week_ago),
        )
        top_tracks = cursor.fetchall()

        # Get stored distributions
        cursor.execute(
            "SELECT distribution FROM weekly_distribution WHERE user_id = %s",
            (user_id,),
        )
        weekly_dist_row = cursor.fetchone()
        weekly_dist = (
            json.loads(weekly_dist_row["distribution"]) if weekly_dist_row else []
        )
        logger.info(f"Weekly distribution for {user_id}: {weekly_dist}")

        cursor.execute(
            "SELECT distribution FROM genre_distribution WHERE user_id = %s", (user_id,)
        )
        genre_dist_row = cursor.fetchone()
        genre_dist = (
            json.loads(genre_dist_row["distribution"]) if genre_dist_row else {}
        )
        logger.info(f"Genre distribution for {user_id}: {genre_dist}")

        # Calculate total listening time (weekly_dist is a list)
        total_hours = sum(weekly_dist) if weekly_dist else 0

        # HTML content with beautified layout and new sections
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 20px;">
            <!-- Header -->
            <div style="background-color: #1DB954; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Your Weekly Spotify Insights</h1>
            </div>
            
            <!-- Container -->
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px;">
                <!-- Key Metrics Section -->
                <h2 style="color: #1DB954; font-size: 20px; border-bottom: 2px solid #1DB954; padding-bottom: 5px;">Key Metrics</h2>
                <p style="font-size: 16px;">Here's your music summary for the week of {last_monday.strftime('%B %d')} - {last_sunday.strftime('%B %d, %Y')}:</p>
                <p style="font-size: 18px; font-weight: bold;">Total Listening Time: {total_hours:.1f} hours</p>
                
                <h3 style="font-size: 18px; color: #333;">Top 5 Tracks This Week:</h3>
                <ul style="list-style-type: none; padding: 0;">
        """

        for track in top_tracks:
            html += f"""
                <li style="margin: 10px 0;">
                    <span style="font-weight: bold;">{track['track_name']}</span> by {track['artist_name']} 
                    <span style="color: #666;">({track['play_count']} plays)</span>
                </li>
            """

        html += """
                </ul>
                
                <!-- Listening Trends Section -->
                <h2 style="color: #1DB954; font-size: 20px; border-bottom: 2px solid #1DB954; padding-bottom: 5px; margin-top: 30px;">Listening Trends</h2>
                <p style="font-size: 16px;">Your weekly listening pattern:</p>
                <img src="cid:weekly_chart" alt="Weekly Listening" style="max-width: 100%; border: 1px solid #ddd; border-radius: 5px;">
                
                <!-- Genre Distribution Section -->
                <h2 style="color: #1DB954; font-size: 20px; border-bottom: 2px solid #1DB954; padding-bottom: 5px; margin-top: 30px;">Genre Distribution</h2>
                <p style="font-size: 16px;">Check out your top genres this week:</p>
                <img src="cid:genre_chart" alt="Genre Distribution" style="max-width: 100%; border: 1px solid #ddd; border-radius: 5px;">
                
                <!-- Actionable Insights Section -->
                <h2 style="color: #1DB954; font-size: 20px; border-bottom: 2px solid #1DB954; padding-bottom: 5px; margin-top: 30px;">Actionable Insights</h2>
                <p style="font-size: 16px;">Get recommendations based on your mood and genre preferences.</p>
                <a href="http://localhost:5174/recommendations" style="display: inline-block; background-color: #1DB954; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">Get Your Recommendations</a>
                
                <!-- Explore More Section -->
                <h2 style="color: #1DB954; font-size: 20px; border-bottom: 2px solid #1DB954; padding-bottom: 5px; margin-top: 30px;">Explore More</h2>
                <p style="font-size: 16px;">Discover more detailed insights and explore your music trends.</p>
                <a href="http://localhost:5174" style="display: inline-block; background-color: #1DB954; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">Visit Your Dashboard</a>
                
                <!-- Footer -->
                <p style="margin-top: 30px; font-size: 14px; color: #666;">Keep rocking those tunes! 🎵</p>
                <p style="font-size: 14px; color: #666;"><em>- Your Spotify Dashboard Team</em></p>
            </div>
        </body>
        </html>
        """
        return html

    except Exception as e:
        logger.error(f"Error in generate_newsletter_content for user {user_id}: {e}")
        raise
    finally:
        cursor.close()
        conn.close()


def send_newsletter(user_id, email):
    try:
        # Generate charts
        from charts import (
            generate_weekly_listening_chart,
            generate_genre_distribution_chart,
        )

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        try:
            cursor.execute(
                "SELECT distribution FROM weekly_distribution WHERE user_id = %s",
                (user_id,),
            )
            weekly_dist_row = cursor.fetchone()
            weekly_dist = (
                json.loads(weekly_dist_row["distribution"]) if weekly_dist_row else []
            )
            logger.info(f"Weekly dist for chart {user_id}: {weekly_dist}")

            cursor.execute(
                "SELECT distribution FROM genre_distribution WHERE user_id = %s",
                (user_id,),
            )
            genre_dist_row = cursor.fetchone()
            genre_dist = (
                json.loads(genre_dist_row["distribution"]) if genre_dist_row else {}
            )
            logger.info(f"Genre dist for chart {user_id}: {genre_dist}")
        finally:
            cursor.close()
            conn.close()

        weekly_chart_path = generate_weekly_listening_chart(user_id, weekly_dist)
        genre_chart_path = generate_genre_distribution_chart(user_id, genre_dist)

        logger.info(f"Weekly chart path: {weekly_chart_path}")
        logger.info(f"Genre chart path: {genre_chart_path}")

        # Email setup
        msg = MIMEMultipart("related")
        msg["Subject"] = "Your Weekly Spotify Insights"
        msg["From"] = EMAIL_USER
        msg["To"] = email

        # Attach HTML content
        html_content = generate_newsletter_content(user_id, email)
        msg.attach(MIMEText(html_content, "html"))

        # Attach images
        for chart_path, cid in [
            (weekly_chart_path, "weekly_chart"),
            (genre_chart_path, "genre_chart"),
        ]:
            if chart_path and os.path.exists(chart_path):
                logger.info(f"Attaching chart: {chart_path}")
                with open(chart_path, "rb") as img:
                    mime_img = MIMEImage(img.read())
                    mime_img.add_header("Content-ID", f"<{cid}>")
                    msg.attach(mime_img)
            else:
                logger.warning(f"Chart not found or not generated: {chart_path}")

        # Send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            server.send_message(msg)

        logger.info(f"✅ Newsletter sent to {email}")

    except Exception as e:
        logger.error(f"❌ Error sending newsletter to {email}: {e}")
        raise


def send_all_newsletters():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT user_id, email FROM users")
        users = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

    for user_id, email in users:
        try:
            send_newsletter(user_id, email)
        except Exception as e:
            logger.error(f"Failed to send newsletter to {email}: {e}")
            continue


# New function for immediate send (synchronous)
def send_all_newsletters_immediately():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT user_id, email FROM users")
        users = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

    for user_id, email in users:
        try:
            send_newsletter(user_id, email)
        except Exception as e:
            logger.error(f"Failed to send newsletter to {email}: {e}")
            continue


if __name__ == "__main__":
    if "--immediate" in sys.argv:
        send_all_newsletters_immediately()
    else:
        send_all_newsletters()
