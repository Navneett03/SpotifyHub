import React, { useState } from "react";
import axios from "axios";
import logo from "./assets/logo.svg"; // adjust path based on your file structure

const PlaylistGenerator = () => {
  const [weather, setWeather] = useState("");
  const [mood, setMood] = useState("");
  const [language, setLanguage] = useState("english");
  const [country, setCountry] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");

  const [loading, setLoading] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [error, setError] = useState("");

const generatePlaylist = async () => {
  setLoading(true);
  setError("");
  setPlaylist([]);

  const defaultPrompt = `Generate 5 ${language} songs suitable for a ${
    mood || "chill"
  } mood, during a ${weather || "pleasant"} weather, in ${
    country || "any"
  } context, preferably for the ${timeOfDay || "evening"}.`;

  const prompt = customPrompt.trim() !== "" ? customPrompt : defaultPrompt;

  try {
    const response = await axios.post("http://localhost:3002/api/generate", {
      prompt,
    });

    const songs = response.data?.songs || [];
    setPlaylist(songs);
  } catch (err) {
    console.error("Error generating playlist:", err);
    setError("Failed to generate playlist. Please try again.");
  } finally {
    setLoading(false);
  }
};



  return (
    <div className="min-h-screen  text-white flex flex-col items-center justify-center p-6">
      {/* Logo & Header */}
      <div className="flex flex-col items-center mb-6">
        <img
          src={logo}
          alt="App Logo"
          className="h-24 p-6 animate-spin-slow drop-shadow-[0_0_2em_#646cffaa]"
        />
        <h1 className="text-3xl font-bold text-purple-400">
          🎶 AI Playlist Generator
        </h1>
      </div>

      {/* Form */}
      <div className="w-full max-w-md space-y-4">
        <div>
          <label className="block text-gray-300 mb-2">Select Weather:</label>
          <select
            value={weather}
            onChange={(e) => setWeather(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded"
          >
            <option value="">-- Choose Weather --</option>
            <option value="rainy">Rainy</option>
            <option value="sunny">Sunny</option>
            <option value="winter">Winter</option>
            <option value="monsoon">Monsoon</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Select Mood:</label>
          <select
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded"
          >
            <option value="">-- Choose Mood --</option>
            <option value="happy">Happy</option>
            <option value="sad">Sad</option>
            <option value="energetic">Energetic</option>
            <option value="chill">Chill</option>
            <option value="romantic">Romantic</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Select Language:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded"
          >
            <option value="english">English</option>
            <option value="hindi">Hindi (Bollywood)</option>
            <option value="korean">Korean</option>
            <option value="spanish">Spanish</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Select Country:</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded"
          >
            <option value="">-- Choose Country --</option>
            <option value="india">India</option>
            <option value="usa">USA</option>
            <option value="korea">Korea</option>
            <option value="global">Global</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-300 mb-2">
            Select Time of Day:
          </label>
          <select
            value={timeOfDay}
            onChange={(e) => setTimeOfDay(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded"
          >
            <option value="">-- Choose Time --</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
            <option value="night">Night</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-300 mb-2">
            Or enter your own prompt:
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Type your custom prompt here..."
            className="w-full p-2 bg-gray-800 rounded resize-none"
            rows={3}
          />
        </div>

        <button
          onClick={generatePlaylist}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded mt-4"
        >
          Generate Playlist 🎵
        </button>
      </div>

      {loading && (
        <p className="mt-6 text-blue-300 animate-pulse">Loading playlist...</p>
      )}
      {error && <p className="mt-6 text-red-400">{error}</p>}

      {playlist.length > 0 && (
        <div className="mt-8 w-full max-w-md bg-gray-800 p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-green-300">
            Your AI-Curated Playlist:
          </h2>
          <ul className="list-disc list-inside space-y-1 text-gray-100 text-left">
            {playlist.map((song, index) => (
              <li key={index}>{song}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PlaylistGenerator;
