# update_weekly.py

from db import get_db_connection
from charts import generate_weekly_listening_chart, generate_genre_distribution_chart
from datetime import datetime, timedelta
import json


def get_all_user_ids():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT user_id FROM users")
    user_ids = [row[0] for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return user_ids


def fetch_weekly_recent_tracks(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    now = datetime.now().replace(microsecond=0)
    one_week_ago = now - timedelta(days=7)

    cursor.execute(
        """
        SELECT played_at, duration_ms, artist_name 
        FROM recent_tracks 
        WHERE user_id = %s AND played_at >= %s AND played_at < %s
        """,
        (user_id, one_week_ago, now),
    )

    results = cursor.fetchall()
    cursor.close()
    conn.close()

    return results


def process_weekly_distribution(data):
    days = [0] * 7  # Index 0 = Monday, 6 = Sunday

    for played_at, duration_ms, _ in data:
        if played_at:
            day_index = played_at.weekday()  # 0 = Monday, 6 = Sunday
            days[day_index] += duration_ms / (1000 * 60 * 60)  # convert ms to hours

    return days


def process_genre_distribution(data):
    from collections import Counter

    genre_counter = Counter()

    for _, _, artist_name in data:
        genres = get_artist_genres(artist_name)
        genre_counter.update(genres)

    return dict(genre_counter)


def get_artist_genres(artist_name):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT genres FROM top_artists
        WHERE artist_name = %s
        LIMIT 1
    """,
        (artist_name,),
    )
    result = cursor.fetchone()
    cursor.close()
    conn.close()

    if result:
        genres_str = result[0]
        return [g.strip() for g in genres_str.split(",") if g.strip()]


def update_weekly_distribution(user_id, distribution):
    conn = get_db_connection()
    cursor = conn.cursor()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute(
        """
        REPLACE INTO weekly_distribution (user_id, distribution, timestamp)
        VALUES (%s, %s, %s)
    """,
        (user_id, json.dumps(distribution), timestamp),
    )

    conn.commit()
    cursor.close()
    conn.close()


def update_genre_distribution(user_id, distribution):
    conn = get_db_connection()
    cursor = conn.cursor()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute(
        """
        REPLACE INTO genre_distribution (user_id, distribution, timestamp)
        VALUES (%s, %s, %s)
    """,
        (user_id, json.dumps(distribution), timestamp),
    )

    conn.commit()
    cursor.close()
    conn.close()


def main():
    user_ids = get_all_user_ids()
    for user_id in user_ids:
        print(f"Processing user: {user_id}")
        data = fetch_weekly_recent_tracks(user_id)

        if not data:
            print("No data found.")
            continue

        weekly_distribution = process_weekly_distribution(data)
        genre_distribution = process_genre_distribution(data)

        update_weekly_distribution(user_id, weekly_distribution)
        update_genre_distribution(user_id, genre_distribution)

        generate_weekly_listening_chart(user_id, weekly_distribution)
        generate_genre_distribution_chart(user_id, genre_distribution)

        print(f"✅ Charts generated and data updated for user: {user_id}")


if __name__ == "__main__":
    from datetime import timedelta

    main()
