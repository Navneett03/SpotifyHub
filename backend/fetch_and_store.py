from db import get_db_connection
import spotipy
import requests
from datetime import datetime, timedelta
from config import SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, REDIRECT_URI


def get_valid_access_token(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT access_token, refresh_token, token_expiry FROM users WHERE user_id = %s",
        (user_id,),
    )
    row = cursor.fetchone()

    if not row:
        cursor.close()
        conn.close()
        raise Exception(f"User not found: {user_id}")

    access_token = row["access_token"]
    refresh_token = row["refresh_token"]
    token_expiry = row["token_expiry"]

    if datetime.utcnow() < token_expiry:
        cursor.close()
        conn.close()
        return access_token

    # Refresh the token
    payload = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": SPOTIFY_CLIENT_ID,
        "client_secret": SPOTIFY_CLIENT_SECRET,
    }

    response = requests.post("https://accounts.spotify.com/api/token", data=payload)
    if response.status_code != 200:
        cursor.close()
        conn.close()
        raise Exception(f"Failed to refresh token for user {user_id}")

    data = response.json()
    new_token = data["access_token"]
    expires_in = data["expires_in"]
    new_expiry = datetime.utcnow() + timedelta(seconds=expires_in)

    cursor.execute(
        "UPDATE users SET access_token = %s, token_expiry = %s WHERE user_id = %s",
        (new_token, new_expiry, user_id),
    )
    conn.commit()

    cursor.close()
    conn.close()
    return new_token


def fetch_and_store_user_data(user_id):
    print(f"\n🔄 Fetching data for user_id: {user_id}")
    try:
        token = get_valid_access_token(user_id)
        sp = spotipy.Spotify(auth=token)

        conn = get_db_connection()
        cursor = conn.cursor()

        # 1. Top Tracks
        for time_range in ["short_term", "medium_term", "long_term"]:
            results = sp.current_user_top_tracks(limit=20, time_range=time_range)
            for item in results["items"]:
                cursor.execute(
                    """
                    INSERT IGNORE INTO top_tracks (user_id, track_id, track_name, artist_name, album_name, played_at, time_range)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                    (
                        user_id,
                        item["id"],
                        item["name"],
                        item["artists"][0]["name"],
                        item["album"]["name"],
                        datetime.utcnow(),
                        time_range,
                    ),
                )

        # 2. Recently Played
        recent = sp.current_user_recently_played(limit=50)
        for item in recent["items"]:
            played_at = datetime.strptime(item["played_at"], "%Y-%m-%dT%H:%M:%S.%fZ")
            cursor.execute(
                """
                INSERT IGNORE INTO recent_tracks (user_id, track_id, track_name, artist_name, album_name, played_at, duration_ms)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
                (
                    user_id,
                    item["track"]["id"],
                    item["track"]["name"],
                    item["track"]["artists"][0]["name"],
                    item["track"]["album"]["name"],
                    played_at,
                    item["track"]["duration_ms"],
                ),
            )

        # 3. Top Artists
        for time_range in ["short_term", "medium_term", "long_term"]:
            results = sp.current_user_top_artists(limit=20, time_range=time_range)
            for artist in results["items"]:
                cursor.execute(
                    """
                    INSERT IGNORE INTO top_artists (user_id, artist_id, artist_name, genres, time_range)
                    VALUES (%s, %s, %s, %s, %s)
                """,
                    (
                        user_id,
                        artist["id"],
                        artist["name"],
                        ",".join(artist["genres"]),
                        time_range,
                    ),
                )

        conn.commit()
        cursor.close()
        conn.close()
        print(f"✅ Data stored for user_id: {user_id}")

    except Exception as e:
        print(f"❌ Error for user {user_id}: {e}")


def fetch_all_users_data():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT user_id FROM users")
    users = cursor.fetchall()
    cursor.close()
    conn.close()

    for (user_id,) in users:
        fetch_and_store_user_data(user_id)


if __name__ == "__main__":
    fetch_all_users_data()
