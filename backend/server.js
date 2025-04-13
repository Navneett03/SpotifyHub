require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const mysql = require("mysql2/promise");
const { spawn } = require("child_process");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10, // Max concurrent connections
  waitForConnections: true, // Queue requests instead of failing
  queueLimit: 0, // Unlimited queue (adjust if needed)
  idleTimeout: 60000, // 60 seconds idle timeout
});

// Handle pool errors
db.on("error", (err) => {
  console.error("Database pool error:", err);
});

const app = express();
const port = 3002;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

// Middleware
app.use(cors());
app.use(express.json());

const csv = require("csv-parser");

let songsDataset = [];

const DATASET_URL =
  "https://raw.githubusercontent.com/rfordatascience/tidytuesday/master/data/2020/2020-01-21/spotify_songs.csv";

axios
  .get(DATASET_URL, { responseType: "stream" })
  .then((response) => {
    response.data
      .pipe(csv())
      .on("data", (data) => {
        songsDataset.push(data);
      })
      .on("end", () => {
        console.log(`Dataset loaded. Total rows: ${songsDataset.length}`);
      })
      .on("error", (err) => {
        console.error("Error parsing CSV:", err);
      });
  })
  .catch((err) => {
    console.error("Error fetching CSV file:", err);
  });

// Function to convert mood to target valence
const getMoodValence = (mood) => {
  const moodValences = {
    happy: 0.8,
    sad: 0.2,
    energetic: 0.9,
    relaxed: 0.3,
    angry: 0.1,
    calm: 0.4,
  };
  return moodValences[mood.toLowerCase()] || 0.5;
};

const getValenceMood = (valence) => {
  if (valence > 0.85) return "Energetic";
  if (valence > 0.6) return "Happy";
  if (valence > 0.35) return "Calm";
  if (valence > 0.25) return "Relaxed";
  if (valence > 0.15) return "Sad";
  return "Angry";
};

app.post("/recommendations/get", async (req, res) => {
  console.log("Received Data:", req.body);

  let { genres, moods, access_token } = req.body;

  if ((!genres || genres.length === 0) && (!moods || moods.length === 0)) {
    let topArtists = [];

    if (access_token) {
      try {
        const topTracksRes = await axios.get(
          "https://api.spotify.com/v1/me/top/tracks",
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
            params: {
              limit: 5,
              time_range: "long_term",
            },
          }
        );

        const topTracks = topTracksRes.data.items || [];
        topArtists = topTracks.flatMap((track) =>
          track.artists.map((artist) => artist.name)
        );
        topArtists = [...new Set(topArtists)].slice(0, 5);
        console.log("Top Artists:", topArtists);
      } catch (err) {
        console.error(
          "Failed to fetch top tracks from Spotify:",
          err.response?.data || err.message
        );
      }

      const LASTFM_API_KEY = "b5ee12266f92048977f84cc491aa0dae";
      let lastFmTopTracks = [];

      for (const artist of topArtists) {
        try {
          const topTracksRes = await axios.get(
            "http://ws.audioscrobbler.com/2.0/",
            {
              params: {
                method: "artist.getTopTracks",
                artist,
                api_key: LASTFM_API_KEY,
                format: "json",
                limit: 5,
              },
            }
          );

          const topTracks = topTracksRes.data.toptracks?.track || [];
          const trackList = topTracks.map((track) => ({
            artist,
            name: track.name,
            playcount: track.playcount,
            url: track.url,
          }));
          lastFmTopTracks.push(...trackList);
        } catch (err) {
          console.error(
            `Error fetching top tracks for artist "${artist}":`,
            err.response?.data || err.message
          );
        }
      }

      console.log("🎶 Last.fm Top Tracks:", lastFmTopTracks);
      const formattedTracks = lastFmTopTracks
        .sort((a, b) => Number(b.playcount) - Number(a.playcount))
        .slice(0, 20)
        .map((track, index) => ({
          serial: index + 1,
          name: track.name,
          artist: track.artist,
          genre: "-",
          mood: "-",
        }));

      return res.json({ data: formattedTracks });
    }
  }

  if (!genres || genres.length === 0) {
    genres = ["Pop", "Rock", "Rap", "Latin", "EDM", "R&B"];
  }

  if (!moods || moods.length === 0) {
    moods = ["Happy", "Sad", "Energetic", "Relaxed", "Angry", "Calm"];
  }

  const targetValences = moods.map((mood) => getMoodValence(mood));
  const tolerance = 0.025;
  const genresLower = genres.map((g) => g.toLowerCase());

  const filteredSongs = songsDataset.filter((song) => {
    if (!song.playlist_genre) return false;
    const songGenre = song.playlist_genre.toLowerCase();
    if (!genresLower.includes(songGenre)) return false;

    const songValence = parseFloat(song.valence);
    return targetValences.some((tv) => Math.abs(songValence - tv) <= tolerance);
  });

  if (filteredSongs.length === 0) {
    return res
      .status(404)
      .json({ data: [], error: "No songs found matching the criteria." });
  }

  const topSongs = filteredSongs
    .sort((a, b) => Number(b.popularity) - Number(a.popularity))
    .slice(0, 20)
    .map((song, index) => ({
      serial: index + 1,
      name: song.track_name,
      artist: song.track_artist,
      genre: song.playlist_genre,
      mood: getValenceMood(song.valence),
    }));

  res.json({ data: topSongs });
});

// Endpoint to exchange code for token
app.post("/api/token", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

  console.log("Received code:", code);
  console.log("CLIENT_ID:", CLIENT_ID);
  console.log("CLIENT_SECRET exists:", !!CLIENT_SECRET);
  console.log("REDIRECT_URI:", REDIRECT_URI);

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;
    const tokenExpiry = new Date(Date.now() + expires_in * 1000);

    const userInfo = await axios.get("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const spotifyUserId = userInfo.data.id;
    const display_name = userInfo.data.display_name || "Unknown";
    const email = userInfo.data.email || `user-${spotifyUserId}@unknown.com`;

    const query = `
      INSERT INTO users (user_id, display_name, email, access_token, refresh_token, token_expiry)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        display_name = VALUES(display_name),
        email = VALUES(email),
        access_token = VALUES(access_token),
        refresh_token = VALUES(refresh_token),
        token_expiry = VALUES(token_expiry)`;

    await db.execute(query, [
      spotifyUserId,
      display_name,
      email,
      access_token,
      refresh_token,
      tokenExpiry,
    ]);
    // Removed await db.end() to keep the pool open

    res.json({
      access_token,
      refresh_token,
      expires_in,
      user_id: spotifyUserId,
    });
  } catch (error) {
    console.error(
      "OAuth error details:",
      error.response?.data || error.message || error
    );
    res.status(500).json({
      error: "Failed during OAuth",
      details: error.response?.data || error.message,
    });
  }
});

app.get("/api/user-info", async (req, res) => {
  const userId = req.query.user_id;

  if (!userId) {
    return res.status(400).json({ error: "user_id is required" });
  }

  try {
    const [rows] = await db.execute(
      "SELECT user_id, display_name, email FROM users WHERE user_id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user_id: rows[0].user_id });
  } catch (err) {
    console.error("Error fetching user info:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/chatbot", async (req, res) => {
  try {
    const response = await axios.post(
      "http://localhost:5174/chatbot",
      req.body
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error calling chatbot API:", error);
    res.status(500).json({ error: "Chatbot service unavailable" });
  }
});

// New endpoint to trigger immediate newsletter send
app.post("/send-newsletter-immediately", (req, res) => {
  const pythonProcess = spawn("python", ["send_newsletter.py", "--immediate"]);

  let output = "";
  let errorOutput = "";

  pythonProcess.stdout.on("data", (data) => {
    output += data.toString();
    console.log(`Python stdout: ${data}`);
  });

  pythonProcess.stderr.on("data", (data) => {
    errorOutput += data.toString();
    console.error(`Python stderr: ${data}`);
  });

  pythonProcess.on("close", (code) => {
    if (code === 0) {
      res.json({ message: "Newsletters sent successfully" });
    } else {
      console.error(`Python process exited with code ${code}`);
      res
        .status(500)
        .json({ error: "Failed to send newsletters", details: errorOutput });
    }
  });
});

const HF_TOKEN = process.env.HF_TOKEN;

app.post("/api/generate", async (req, res) => {
  const { prompt } = req.body;
  console.log("Received Prompt:", prompt);

  try {
    const hfPrompt = `Generate 5 real and popular song names for a playlist based on this theme: "${prompt}". Return each song name in a new line without extra text.`;

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1",
      {
        inputs: hfPrompt,
        parameters: {
          temperature: 0.7,
          max_new_tokens: 100,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const rawText = response.data[0]?.generated_text || "";

    // Clean and parse into individual song names
    const generatedText = response.data[0].generated_text;
    const songs = generatedText
      .split("\n")
      .filter(
        (line) => line.trim() !== "" && !line.toLowerCase().includes("generate")
      )
      .map((line) => line.replace(/^\d+[\.\)]?\s*/, "")); // Remove number prefixes like "1. "

    console.log("Generated Songs:", songs);
    res.json({ songs }); // Clean response
  } catch (error) {
    console.error(
      "Hugging Face API Error:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to generate playlist" });
  }
});



// Start the server
app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
