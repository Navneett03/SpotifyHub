CREATE DATABASE IF NOT EXISTS spotify_newsletter;
USE spotify_newsletter;

-- User info (basic metadata)
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(255) PRIMARY KEY,
    display_name VARCHAR(255),
    email VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    token_expiry DATETIME
);

-- Top Tracks
CREATE TABLE IF NOT EXISTS top_tracks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    track_id VARCHAR(255),
    track_name VARCHAR(255),
    artist_name VARCHAR(255),
    album_name VARCHAR(255),
    played_at DATETIME,
    time_range VARCHAR(50), -- short_term, medium_term, long_term
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Recently Played Tracks
CREATE TABLE IF NOT EXISTS recent_tracks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    track_id VARCHAR(255),
    track_name VARCHAR(255),
    artist_name VARCHAR(255),
    album_name VARCHAR(255),
    played_at DATETIME,
    duration_ms INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Top Artists
CREATE TABLE IF NOT EXISTS top_artists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    artist_id VARCHAR(255),
    artist_name VARCHAR(255),
    genres TEXT,
    time_range VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Weekly Listening Distribution
CREATE TABLE IF NOT EXISTS weekly_distribution (
    user_id VARCHAR(255) PRIMARY KEY,
    distribution TEXT NOT NULL,
    timestamp DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Genre Distribution
CREATE TABLE IF NOT EXISTS genre_distribution (
    user_id VARCHAR(255) PRIMARY KEY,
    distribution TEXT NOT NULL,
    timestamp DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- SELECT * FROM users;
-- SELECT * FROM recent_tracks where user_id = '316g5p76ywr5cgp2c5antuhbozri';
-- drop database spotify_newsletter;

ALTER TABLE recent_tracks ADD CONSTRAINT unique_recent_track UNIQUE (user_id, track_id, played_at);