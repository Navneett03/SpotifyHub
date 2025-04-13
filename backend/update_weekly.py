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
    # Prepare past 7 dates (from 6 days ago to today)
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    past_7_days = [(today - timedelta(days=i)) for i in range(6, -1, -1)]

    # Create a mapping from date (only) to index
    date_index_map = {d.date(): i for i, d in enumerate(past_7_days)}
    hours_per_day = [0] * 7

    for played_at, duration_ms, _ in data:
        if played_at:
            date_only = played_at.date()
            if date_only in date_index_map:
                index = date_index_map[date_only]
                hours_per_day[index] += duration_ms / (1000 * 60 * 60)  # ms to hours

    # Format labels as "Mon\nApr 7"
    x_labels = [d.strftime("%a\n%b %d") for d in past_7_days]
    
    return hours_per_day, x_labels


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

        hours_per_day, x_labels = process_weekly_distribution(data)
        genre_distribution = process_genre_distribution(data)

        update_weekly_distribution(user_id, hours_per_day)
        update_genre_distribution(user_id, genre_distribution)

        weekly_chart_path = generate_weekly_listening_chart(user_id, hours_per_day, x_labels)
        genre_chart_path = generate_genre_distribution_chart(user_id, genre_distribution)

        print(f"✅ Charts generated and data updated for user: {user_id}")
        print({weekly_chart_path})
        print({genre_chart_path})


if __name__ == "__main__":
    from datetime import timedelta

    main()
