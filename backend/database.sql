CREATE DATABASE spotify_insights;
USE spotify_insights;

CREATE TABLE users (
    id INT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255)
);

CREATE TABLE weekly_music_insights (
    user_id INT,
    week_start DATE,
    week_end DATE,
    top_tracks TEXT,
    recently_played TEXT,
    artist_popularity JSON,
    listening_trends JSON,
    genre_distribution JSON,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO users (id, name, email) 
VALUES (1, 'Mansa Mahendru', '11211mansamahendru11nonmedb@gmail.com');


INSERT INTO weekly_music_insights 
(user_id, week_start, week_end, top_tracks, recently_played, artist_popularity, listening_trends, genre_distribution)
VALUES
(1, '2025-03-24', '2025-03-30',
'["Bolo Na - Film Version by Shantanu Moitra", "Mann Mohanaa by A.R. Rahman", "Lit by Feora", "Fireworks Festival - Weathering with You (Lofi Remix) by Palademix", "Man of the World by Feora"]',
'["ishq x tera mera rishta by Tuneit", "Jhol by Maanu", "Jhol by Maanu", "Tum Ho by Mohit Chauhan", "Haan Ke Haan by Sohail Sen"]',
'{
    "Feora": 0,
    "A.R. Rahman": 1.8901,
    "Armaan Malik": 3.1258,
    "Pritam": 4.2363,
    "Arijit Singh": 0,
    "Atif Aslam": 1.0816,
    "Vishal-Shekhar": 1.0507,
    "Melodrama": 0,
    "Sanam": 0,
    "Dramatic Violin": 0
}',
'{
    "2025-03-24": 0,
    "2025-03-25": 0,
    "2025-03-26": 50.6,
    "2025-03-27": 0,
    "2025-03-28": 25.3,
    "2025-03-29": 0,
    "2025-03-30": 74.4
}',
'{
    "bollywood": 45,
    "bhajan": 22,
    "hindi pop": 14,
    "indian indie": 12,
    "tamil pop": 7
}');
update users SET email = 'mahendrumansa2004@gmail.com' where id = 1;