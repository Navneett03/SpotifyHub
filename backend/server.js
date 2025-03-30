const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const port = 3002;

const CLIENT_ID = "219374d3b5cd4f68a21ced4067070aec"; // Your Client ID
const CLIENT_SECRET = "8737479dd9234942b1bfdbf7c8cbdf67"; // Replace with your real Client Secret
const REDIRECT_URI = "http://localhost:5174"; // Your redirect URI

// Middleware
app.use(cors()); // Allow requests from the frontend
app.use(express.json()); // Parse JSON request bodies

const csv = require("csv-parser");

// Global variable to store the dataset from the CSV
let songsDataset = [];



// Load the dataset at startup from the CSV URL
const DATASET_URL = "https://raw.githubusercontent.com/rfordatascience/tidytuesday/master/data/2020/2020-01-21/spotify_songs.csv";

axios.get(DATASET_URL, { responseType: "stream" })
  .then(response => {
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
  .catch(err => {
    console.error("Error fetching CSV file:", err);
  });

// Function to convert mood to target valence
const getMoodValence = (mood) => {
  const moodValences = {
    happy: 0.8,      // Happy mood -> high valence
    sad: 0.2,        // Sad mood -> low valence
    energetic: 0.9,  // Energetic mood -> high valence
    relaxed: 0.3,    // Relaxed mood -> low valence
    angry: 0.1,      // Angry mood -> low valence
    calm: 0.4,       // Calm mood -> low to moderate valence
  };
  return moodValences[mood.toLowerCase()] || 0.5; // Default to neutral
};

const getValenceMood = (valence) => {
  if (valence > 0.85) return "Energetic";
  if (valence > 0.6) return "Happy";
  if (valence > 0.35) return "Calm";
  if (valence > 0.25) return "Relaxed";
  if (valence > 0.15) return "Sad";
  return "Angry";
}

/*
 * Endpoint to get top 20 song recommendations from the dataset
 */
app.post("/recommendations/get", (req, res) => {
  console.log("Received Data:", req.body);

  let { genres, moods } = req.body;

  // If both genres and moods are not selected, return NULL data
  if ((!genres || genres.length === 0) && (!moods || moods.length === 0)) {
    return res.json({ data: [] });
  }

  // If genres are not provided or empty, use all unique genres from the dataset
  if (!genres || genres.length === 0) {
    genres = ['Pop', 'Rock', 'Rap', 'Latin', 'EDM', 'R&B'];
  }

  // If moods are not provided or empty, use all possible moods
  if (!moods || moods.length === 0) {
    moods = ["Happy", "Sad", "Energetic", "Relaxed", "Angry", "Calm"];
  }

  // Compute target valences for all provided moods
  const targetValences = moods.map(mood => getMoodValence(mood));
  const tolerance = 0.025; // Adjust tolerance as needed

  // Prepare genres for case-insensitive matching
  const genresLower = genres.map(g => g.toLowerCase());

  // Filter dataset by genre and mood (via valence)
  const filteredSongs = songsDataset.filter(song => {
    // Check genre match (assuming playlist_genre field exists)
    if (!song.playlist_genre) return false;
    const songGenre = song.playlist_genre.toLowerCase();
    if (!genresLower.includes(songGenre)) return false;

    // Check valence closeness for any of the target valences
    const songValence = parseFloat(song.valence);
    return targetValences.some(tv => Math.abs(songValence - tv) <= tolerance);
  });

  if (filteredSongs.length === 0) {
    return res.status(404).json({ data: [], error: "No songs found matching the criteria." });
  }

  // Sort the filtered songs by popularity (descending) and take top 20
  const topSongs = filteredSongs
    .sort((a, b) => Number(b.popularity) - Number(a.popularity))
    .slice(0, 20)
    .map((song,index) => ({
      serial: index+1,
      name: song.track_name,
      artist: song.track_artist,
      genre: song.playlist_genre,
      mood: getValenceMood(song.valence)
    }));

  res.json({ data: topSongs });
});



// Endpoint to exchange code for token
app.post("/api/token", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

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

    res.json(response.data);
  } catch (error) {
    console.error("Error exchanging code for token:", error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data?.error || "Failed to exchange code" });
  }
});

app.post("/api/chatbot", async (req, res) => {
  try {
      const response = await axios.post("http://localhost:5001/chatbot", req.body);
      res.json(response.data);
  } catch (error) {
      console.error("Error calling chatbot API:", error);
      res.status(500).json({ error: "Chatbot service unavailable" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});