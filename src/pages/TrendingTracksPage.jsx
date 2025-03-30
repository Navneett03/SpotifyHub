import { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";
import Header from "../components/common/Header";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, Label
} from "recharts";

const COLORS = ["#1DB954", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FED766", "#FF9F40", "#FF5E78", "#A77BCA", "#FFD700", "#40C4FF"];

const TrendingTracksPage = () => {
  const { token } = useContext(AuthContext);
  const [tracks, setTracks] = useState([]);
  const [topGenreShareData, setTopGenreShareData] = useState([]);
  const [artistTrackCountData, setArtistTrackCountData] = useState([]);
  const [trackLengthSpreadData, setTrackLengthSpreadData] = useState([]);
  const [avgPopularityByGenreData, setAvgPopularityByGenreData] = useState([]);
  const [summaryStats, setSummaryStats] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drillDowns, setDrillDowns] = useState([]); // Array for multiple drill-downs
  const [activeDrillDown, setActiveDrillDown] = useState(null); // Index of active drill-down
  const [sliderIndex, setSliderIndex] = useState(0); // Slider position

  useEffect(() => {
    if (!token) {
      setError("Missing Spotify authentication token. Please log in.");
      setLoading(false);
      return;
    }

    const fetchTrendingTracks = async (retryCount = 0) => {
      try {
        setLoading(true);
        console.log("Fetching trending tracks from Spotify...");
        const res = await axios.get("https://api.spotify.com/v1/search", {
          headers: { Authorization: `Bearer ${token}` },
          params: { q: "top hits 2025", type: "track", limit: 20, market: "US" },
        });
        const trackItems = res.data.tracks?.items || [];
        if (!trackItems.length) throw new Error("No trending tracks found.");

        const artistIds = trackItems.map(track => track.artists[0]?.id).filter(Boolean).join(",");
        let artists = [];
        if (artistIds) {
          const artistsRes = await axios.get(`https://api.spotify.com/v1/artists?ids=${artistIds}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          artists = artistsRes.data.artists || [];
        }

        const enrichedTracks = trackItems.map((track, i) => ({
          ...track,
          genres: artists.find(a => a.id === track.artists[0]?.id)?.genres || ["Unknown"],
          artistPopularity: artists.find(a => a.id === track.artists[0]?.id)?.popularity || 0,
        })).filter(t => t.popularity > 0 && t.duration_ms > 0);

        const popularities = enrichedTracks.map(t => t.popularity);
        const durations = enrichedTracks.map(t => t.duration_ms / 60000);
        const totalTracks = enrichedTracks.length;

        const genreCounts = enrichedTracks.reduce((acc, t) => {
          const genre = t.genres[0];
          acc[genre] = (acc[genre] || 0) + 1;
          return acc;
        }, {});
        const mostCommonGenre = Object.entries(genreCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
        const topGenreSharePie = [
          { name: mostCommonGenre, value: genreCounts[mostCommonGenre] },
          { name: "Other Genres", value: totalTracks - genreCounts[mostCommonGenre] }
        ];

        const artistTrackCount = enrichedTracks.reduce((acc, t) => {
          const artist = t.artists[0]?.name || "Unknown";
          acc[artist] = (acc[artist] || 0) + 1;
          return acc;
        }, {});
        const artistTrackCountBar = Object.entries(artistTrackCount)
          .map(([artist, count]) => ({ name: artist, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        const lengthSpread = {
          "Short (<3 min)": enrichedTracks.filter(t => t.duration_ms / 60000 < 3).length,
          "Medium (3-5 min)": enrichedTracks.filter(t => t.duration_ms / 60000 >= 3 && t.duration_ms / 60000 <= 5).length,
          "Long (>5 min)": enrichedTracks.filter(t => t.duration_ms / 60000 > 5).length,
        };
        const trackLengthSpreadBar = Object.entries(lengthSpread).map(([category, count]) => ({ name: category, count }));

        const avgPopByGenre = Object.entries(genreCounts).map(([genre]) => {
          const genreTracks = enrichedTracks.filter(t => t.genres[0] === genre);
          const avgPop = genreTracks.reduce((sum, t) => sum + t.popularity, 0) / genreTracks.length;
          return { name: genre, avgPopularity: avgPop.toFixed(2) };
        });

        const avgPopularity = popularities.reduce((sum, p) => sum + p, 0) / popularities.length;
        const medianPopularity = popularities.sort((a, b) => a - b)[Math.floor(popularities.length / 2)];
        const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;

        setTracks(enrichedTracks);
        setSummaryStats({
          avgPopularity: avgPopularity.toFixed(2),
          medianPopularity: medianPopularity.toFixed(2),
          avgDuration: avgDuration.toFixed(2),
          topGenre: mostCommonGenre,
          topGenreShare: ((genreCounts[mostCommonGenre] / totalTracks) * 100).toFixed(2),
          totalTracks: totalTracks,
        });
        setTopGenreShareData(topGenreSharePie);
        setArtistTrackCountData(artistTrackCountBar);
        setTrackLengthSpreadData(trackLengthSpreadBar);
        setAvgPopularityByGenreData(avgPopByGenre);
        setLastUpdated(new Date().toLocaleString());
        setLoading(false);
        setError(null);
      } catch (error) {
        console.error("Spotify API error:", error.response?.status, error.message);
        if (error.response?.status === 429 && retryCount < 3) {
          console.log(`Rate limit hit. Retry ${retryCount + 1}/3 in 60s...`);
          await new Promise(resolve => setTimeout(resolve, 60000));
          fetchTrendingTracks(retryCount + 1);
        } else {
          setError(`Error: ${error.response?.data?.error?.message || error.message}`);
          setLoading(false);
        }
      }
    };
    fetchTrendingTracks();
  }, [token]);

  const addDrillDown = (type, value) => {
    const newDrillDown = { type, value };
    setDrillDowns(prev => {
      const exists = prev.find(d => d.type === type && d.value[type === "genre" || type === "genrePop" ? "genre" : type === "artist" ? "artist" : "category"] === value[type === "genre" || type === "genrePop" ? "genre" : type === "artist" ? "artist" : "category"]);
      if (exists) return prev; // Avoid duplicates
      return [...prev, newDrillDown];
    });
    setActiveDrillDown(drillDowns.length); // Set to the newly added drill-down
    setSliderIndex(0); // Reset slider
  };

  const handleGenreDrillDown = (data) => {
    if (data && data.name !== "Other Genres") {
      const genre = data.name;
      const genreTracks = tracks.filter(t => t.genres[0] === genre).slice(0, 5);
      addDrillDown("genre", { genre, tracks: genreTracks });
    }
  };

  const handleArtistDrillDown = (data) => {
    if (data) {
      const artist = data.name;
      const artistTracks = tracks.filter(t => t.artists[0]?.name === artist);
      addDrillDown("artist", { artist, tracks: artistTracks });
    }
  };

  const handleLengthDrillDown = (data) => {
    if (data) {
      const category = data.name;
      let lengthTracks = [];
      if (category === "Short (<3 min)") {
        lengthTracks = tracks.filter(t => t.duration_ms / 60000 < 3).slice(0, 5);
      } else if (category === "Medium (3-5 min)") {
        lengthTracks = tracks.filter(t => t.duration_ms / 60000 >= 3 && t.duration_ms / 60000 <= 5).slice(0, 5);
      } else {
        lengthTracks = tracks.filter(t => t.duration_ms / 60000 > 5).slice(0, 5);
      }
      addDrillDown("length", { category, tracks: lengthTracks });
    }
  };

  const handleGenrePopDrillDown = (data) => {
    if (data) {
      const genre = data.name;
      const genreTracks = tracks.filter(t => t.genres[0] === genre).slice(0, 5);
      addDrillDown("genrePop", { genre, tracks: genreTracks });
    }
  };

  const removeDrillDown = (index) => {
    setDrillDowns(prev => prev.filter((_, i) => i !== index));
    setActiveDrillDown(prev => prev > 0 ? prev - 1 : null);
    setSliderIndex(0);
  };

  const slideLeft = () => setSliderIndex(prev => Math.max(prev - 1, 0));
  const slideRight = (maxIndex) => setSliderIndex(prev => Math.min(prev + 1, maxIndex - 3)); // Show 3 tracks at a time

  return (
    <div className="flex-1 overflow-auto relative z-10 bg-black text-gray-300">
      <Header title="Trending Tracks Insights" />
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {loading ? (
          <div className="text-center text-gray-400">Loading trending tracks...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
          <>
            <motion.div className="glass-card p-6 mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h2 className="text-2xl font-semibold text-white mb-4">What’s Hot on Spotify in 2025?</h2>
              <p className="mb-4 text-sm">Our take on top tracks, updated: {lastUpdated}</p>
              <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-2">Quick Look</h3>
                <p>Avg Popularity: <span className="text-green-500">{summaryStats.avgPopularity}/100</span> (Median: {summaryStats.medianPopularity}) - How popular tracks are.</p>
                <p>Avg Length: <span className="text-green-500">{summaryStats.avgDuration} min</span> - Typical track duration.</p>
                <p>Top Genre: <span className="text-green-500">{summaryStats.topGenre}</span> - Covers <span className="text-green-500">{summaryStats.topGenreShare}%</span> of tracks.</p>
              </div>
              <ul className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {tracks.map(track => (
                  <li key={track.id} className="flex items-center p-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors">
                    <img
                      src={track.album?.images?.[2]?.url || "https://via.placeholder.com/64"}
                      alt={track.name}
                      className="w-12 h-12 mr-3 rounded"
                    />
                    <div>
                      <p className="text-white font-medium">{track.name}</p>
                      <p className="text-sm">{track.artists[0]?.name} - Popularity: {track.popularity}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h3 className="text-lg font-medium text-white mb-2">Which Genre Stands Out?</h3>
                <p className="text-xs text-gray-500 mb-4">Share of tracks in the top genre (click it for tracks)</p>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={topGenreShareData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} onClick={handleGenreDrillDown}>
                      {topGenreShareData.map((entry, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "rgba(31, 41, 55, 0.8)", borderColor: "#4B5563" }} formatter={(value, name) => [`${value} tracks (${((value / summaryStats.totalTracks) * 100).toFixed(1)}%)`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <h3 className="text-lg font-medium text-white mb-2">Who’s Got the Most Tracks?</h3>
                <p className="text-xs text-gray-500 mb-4">Number of tracks per artist (click for their tracks)</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={artistTrackCountData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" angle={-45} textAnchor="end" height={60} label={{ value: "Artists", position: "insideBottom", offset: -5 }} />
                    <YAxis stroke="#9CA3AF" label={{ value: "Number of Tracks", angle: -90, position: "insideLeft" }} />
                    <Tooltip contentStyle={{ backgroundColor: "rgba(31, 41, 55, 0.8)", borderColor: "#4B5563" }} formatter={(value) => [`${value} tracks`, "Track Count"]} />
                    <Bar dataKey="count" fill="#1DB954" onClick={handleArtistDrillDown} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <h3 className="text-lg font-medium text-white mb-2">How Long Are Tracks?</h3>
                <p className="text-xs text-gray-500 mb-4">Track count by length category (click for tracks)</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trackLengthSpreadData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" label={{ value: "Length Categories", position: "insideBottom", offset: -5 }} />
                    <YAxis stroke="#9CA3AF" label={{ value: "Number of Tracks", angle: -90, position: "insideLeft" }} />
                    <Tooltip contentStyle={{ backgroundColor: "rgba(31, 41, 55, 0.8)", borderColor: "#4B5563" }} formatter={(value) => [`${value} tracks`, "Track Count"]} />
                    <Bar dataKey="count" fill="#FF6B6B" onClick={handleLengthDrillDown} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                <h3 className="text-lg font-medium text-white mb-2">Which Genres Are Most Popular?</h3>
                <p className="text-xs text-gray-500 mb-4">Average popularity per genre (click for tracks)</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={avgPopularityByGenreData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" angle={-45} textAnchor="end" height={60} label={{ value: "Genres", position: "insideBottom", offset: -5 }} />
                    <YAxis stroke="#9CA3AF" domain={[0, 100]} label={{ value: "Average Popularity", angle: -90, position: "insideLeft" }} />
                    <Tooltip contentStyle={{ backgroundColor: "rgba(31, 41, 55, 0.8)", borderColor: "#4B5563" }} formatter={(value) => [`${value}/100`, "Avg Popularity"]} />
                    <Bar dataKey="avgPopularity" fill="#FED766" onClick={handleGenrePopDrillDown} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {drillDowns.length > 0 && (
              <motion.div className="glass-card p-6 mt-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="flex flex-wrap gap-2 mb-4">
                  {drillDowns.map((drillDown, index) => (
                    <div
                      key={index}
                      className={`flex items-center px-3 py-1 rounded-full cursor-pointer ${activeDrillDown === index ? "bg-green-500 text-white" : "bg-gray-700 text-gray-300"}`}
                      onClick={() => { setActiveDrillDown(index); setSliderIndex(0); }}
                    >
                      <span>
                        {drillDown.type === "genre" ? `${drillDown.value.genre}` : 
                         drillDown.type === "artist" ? `${drillDown.value.artist}` : 
                         drillDown.type === "length" ? `${drillDown.value.category}` : 
                         `${drillDown.value.genre}`}
                      </span>
                      <button
                        className="ml-2 text-sm text-red-400 hover:text-red-300"
                        onClick={(e) => { e.stopPropagation(); removeDrillDown(index); }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {activeDrillDown !== null && (
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      {drillDowns[activeDrillDown].type === "genre" ? `Top Tracks in ${drillDowns[activeDrillDown].value.genre}` : 
                       drillDowns[activeDrillDown].type === "artist" ? `Tracks by ${drillDowns[activeDrillDown].value.artist}` : 
                       drillDowns[activeDrillDown].type === "length" ? `Tracks in ${drillDowns[activeDrillDown].value.category}` : 
                       `Tracks in ${drillDowns[activeDrillDown].value.genre}`}
                    </h3>
                    <p className="text-sm mb-4">
                      {drillDowns[activeDrillDown].type === "genre" ? `Here are the top tracks in ${drillDowns[activeDrillDown].value.genre}.` : 
                       drillDowns[activeDrillDown].type === "artist" ? `All tracks by ${drillDowns[activeDrillDown].value.artist} in the top hits.` : 
                       drillDowns[activeDrillDown].type === "length" ? `Tracks in the ${drillDowns[activeDrillDown].value.category} category.` : 
                       `Tracks in ${drillDowns[activeDrillDown].value.genre} with their popularity.`}
                    </p>
                    <div className="relative flex items-center">
                      <button
                        onClick={slideLeft}
                        disabled={sliderIndex === 0}
                        className="p-2 text-green-500 hover:text-green-400 disabled:text-gray-500"
                      >
                        ←
                      </button>
                      <div className="flex overflow-hidden w-full">
                        <motion.div
                          className="flex gap-4"
                          animate={{ x: `-${sliderIndex * 33.33}%` }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          style={{ width: `${drillDowns[activeDrillDown].value.tracks.length * 33.33}%` }}
                        >
                          {drillDowns[activeDrillDown].value.tracks.map((track, i) => (
                            <div
                              key={track.id}
                              className="flex-shrink-0 w-1/3 p-2 bg-gray-800 rounded"
                            >
                              <img
                                src={track.album?.images?.[2]?.url || "https://via.placeholder.com/64"}
                                alt={track.name}
                                className="w-12 h-12 mb-2 rounded"
                              />
                              <p className="text-white font-medium text-sm">{track.name}</p>
                              <p className="text-xs">{track.artists[0]?.name}</p>
                              <p className="text-xs">Pop: {track.popularity}</p>
                              <p className="text-xs">Len: {(track.duration_ms / 60000).toFixed(2)} min</p>
                            </div>
                          ))}
                        </motion.div>
                      </div>
                      <button
                        onClick={() => slideRight(drillDowns[activeDrillDown].value.tracks.length)}
                        disabled={sliderIndex >= drillDowns[activeDrillDown].value.tracks.length - 3}
                        className="p-2 text-green-500 hover:text-green-400 disabled:text-gray-500"
                      >
                        →
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default TrendingTracksPage;