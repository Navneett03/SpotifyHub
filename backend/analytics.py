import pandas as pd
from datetime import datetime, timedelta
from collections import Counter
import json
from db import get_db_connection

def get_weekly_listening_distribution(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    one_week_ago = datetime.utcnow() - timedelta(days=7)

    cursor.execute("""
        SELECT played_at FROM recent_tracks
        WHERE user_id = %s AND played_at >= %s
    """, (user_id, one_week_ago))
    rows = cursor.fetchall()
    cursor.close()

    df = pd.DataFrame(rows)
    df['played_at'] = pd.to_datetime(df['played_at'])
    df['day'] = df['played_at'].dt.strftime('%A')
    df['hour'] = df['played_at'].dt.hour

    distribution = df.groupby(['day', 'hour']).size().unstack(fill_value=0)
    return distribution.to_dict()

def get_weekly_genre_distribution(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    one_week_ago = datetime.utcnow() - timedelta(days=7)

    cursor.execute("""
        SELECT DISTINCT artist_name FROM recent_tracks
        WHERE user_id = %s AND played_at >= %s
    """, (user_id, one_week_ago))
    artist_names = [row['artist_name'] for row in cursor.fetchall()]

    if not artist_names:
        return {}

    format_strings = ','.join(['%s'] * len(artist_names))
    query = f"""
        SELECT artist_name, genres FROM top_artists
        WHERE user_id = %s AND artist_name IN ({format_strings})
    """
    cursor.execute(query, [user_id] + artist_names)
    genre_rows = cursor.fetchall()

    cursor.close()

    genre_counter = Counter()
    for row in genre_rows:
        genres = row['genres'].split(',')
        genre_counter.update(genres)

    return dict(genre_counter)

def store_weekly_stats(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.utcnow()

    genre_data = get_weekly_genre_distribution(user_id)
    listening_data = get_weekly_listening_distribution(user_id)

    cursor.execute("""
        INSERT INTO weekly_distribution (user_id, distribution, timestamp)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE distribution = VALUES(distribution), timestamp = VALUES(timestamp)
    """, (user_id, json.dumps(listening_data), now))

    cursor.execute("""
        INSERT INTO genre_distribution (user_id, distribution, timestamp)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE distribution = VALUES(distribution), timestamp = VALUES(timestamp)
    """, (user_id, json.dumps(genre_data), now))

    conn.commit()
    cursor.close()
    conn.close()
