import { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";
import Header from "../components/common/Header";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const COLORS = ["#1DB954", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FED766", "#FF9F40", "#A77BCA", "#FF6384", "#36A2EB", "#FFCE56"];

const GENRE_COUNTRY_MAP = {
  pop: ["USA", "UK", "Sweden"],
  rock: ["USA", "UK", "Australia"],
  "hip hop": ["USA", "Canada"],
  bollywood: ["India"],
};

const COUNTRY_COORDS = {
  USA: [37.0902, -95.7129],
  UK: [55.3781, -3.4360],
  Sweden: [64.0000, 20.0000],
  Australia: [-25.2744, 133.7751],
  Canada: [56.1304, -106.3468],
  India: [20.5937, 78.9629],
};

const MyListeningPage = () => {
  const { token } = useContext(AuthContext);
  const [topTracks, setTopTracks] = useState([]);
  const [recentTracks, setRecentTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [listeningTime, setListeningTime] = useState([]); // Renamed from listeningTracks
  const [weeklyListening, setWeeklyListening] = useState([]);
  const [consistencyDetails, setConsistencyDetails] = useState([]);
  const [artistTrends, setArtistTrends] = useState([]);
  const [travelGenre, setTravelGenre] = useState(null);
  const [travelCountries, setTravelCountries] = useState([]);
  const [countryArtists, setCountryArtists] = useState([]);
  const [artistPopularity, setArtistPopularity] = useState(null);
  const [selectedPeriodTime, setSelectedPeriodTime] = useState("week"); // Renamed from selectedPeriodTracks
  const [selectedPeriodWeekly, setSelectedPeriodWeekly] = useState("week");
  const [selectedPeriodArtists, setSelectedPeriodArtists] = useState("week");
  const [showConsistencyDetails, setShowConsistencyDetails] = useState(false);
  const [insights, setInsights] = useState({
    peakTime: "", // Renamed from peakTracks
    peakListeningDay: "",
    consistency: "",
    topArtistTrend: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchListeningData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!token) throw new Error("No valid token provided.");

      const topTracksRes = await axios.get("https://api.spotify.com/v1/me/top/tracks", {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 10, time_range: "long_term" },
      });
      const topTracksData = topTracksRes.data.items || [];
      setTopTracks(topTracksData);

      const recentTracksRes = await axios.get("https://api.spotify.com/v1/me/player/recently-played", {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 50 },
      });
      const recentTracksData = recentTracksRes.data.items || [];
      setRecentTracks(recentTracksData);

      const topArtistsRes = await axios.get("https://api.spotify.com/v1/me/top/artists", {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 10, time_range: "long_term" },
      });
      const topArtistsData = topArtistsRes.data.items || [];
      setTopArtists(topArtistsData);

      // Section 2: Total Time Listened (Initial: Week)
      const now = new Date();
      const timeByDay = recentTracksData.reduce((acc, item) => {
        const playedAt = new Date(item.played_at);
        const dayName = playedAt.toLocaleString("en-US", { weekday: "short" });
        if (playedAt > new Date(now - 7 * 24 * 60 * 60 * 1000)) {
          acc[dayName] = (acc[dayName] || 0) + item.track.duration_ms / 60000; // Convert ms to minutes
        }
        return acc;
      }, {});
      const weeklyTime = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => ({
        day,
        minutes: timeByDay[day] || 0,
      }));
      setListeningTime(weeklyTime);
      const peakDay = weeklyTime.reduce((max, d) => (d.minutes > max.minutes ? d : max), { day: "", minutes: 0 });
      setInsights(prev => ({
        ...prev,
        peakTime: peakDay.minutes > 0 ? `Peak: ${peakDay.day} (${peakDay.minutes.toFixed(1)} mins)` : "No listening this week.",
      }));

      // Section 3: Total Tracks Played (Initial: Week)
      const weeklyData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const tracks = recentTracksData.reduce((acc, item) => {
          const playedAt = new Date(item.played_at);
          if (playedAt.toISOString().split("T")[0] === dateStr) {
            return acc + 1;
          }
          return acc;
        }, 0);
        return { date: dateStr, tracks };
      }).reverse();
      setWeeklyListening(weeklyData);
      const peakDayListening = weeklyData.reduce((max, d) => (d.tracks > max.tracks ? d : max), { date: "", tracks: 0 });
      setInsights(prev => ({
        ...prev,
        peakListeningDay: peakDayListening.tracks > 0 ? `Peak: ${peakDayListening.date} (${peakDayListening.tracks} tracks)` : "Not enough data.",
      }));

      // Section 4: Song Repetition
      const trackPlayCounts = recentTracksData.reduce((acc, item) => {
        const trackId = item.track.id;
        acc[trackId] = (acc[trackId] || 0) + 1;
        return acc;
      }, {});
      const repeatedTracks = Object.entries(trackPlayCounts)
        .filter(([_, count]) => count > 1)
        .map(([trackId, count]) => {
          const track = recentTracksData.find(t => t.track.id === trackId);
          return {
            name: `${track.track.name} by ${track.track.artists[0].name}`.substring(0, 30),
            repeats: count,
          };
        });
      setConsistencyDetails(repeatedTracks);
      const totalPlays = recentTracksData.length;
      const repeatPlays = repeatedTracks.reduce((sum, t) => sum + t.repeats, 0);
      const repeatPercentage = totalPlays > 0 ? (repeatPlays / totalPlays) * 100 : 0;
      setInsights(prev => ({
        ...prev,
        consistency: repeatPercentage > 0 ? `${repeatPercentage.toFixed(1)}% repeated (${repeatPlays} of ${totalPlays} plays)` : "No repeats in last 50 plays.",
      }));

      // Section 5: Artist Trends (Initial: Week)
      const artistDailyPlays = recentTracksData.reduce((acc, item) => {
        const playedAt = new Date(item.played_at);
        const dateStr = playedAt.toISOString().split("T")[0];
        const artistName = item.track.artists[0].name;
        if (!acc[artistName]) acc[artistName] = {};
        acc[artistName][dateStr] = (acc[artistName][dateStr] || 0) + 1;
        return acc;
      }, {});
      const trendData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split("T")[0];
        const dayData = { date: dateStr };
        topArtistsData.forEach(artist => {
          dayData[artist.name] = artistDailyPlays[artist.name]?.[dateStr] || 0;
        });
        return dayData;
      }).reverse();
      setArtistTrends(trendData);
      const topArtist = topArtistsData[0]?.name || "None";
      const topPlays = trendData.reduce((sum, day) => sum + (day[topArtist] || 0), 0);
      setInsights(prev => ({
        ...prev,
        topArtistTrend: topPlays > 0 ? `${topArtist} leads with ${topPlays} plays this week.` : "No standout artist this week.",
      }));

      setLoading(false);
    } catch (error) {
      console.error("Fetch error:", error.message);
      setError(error.response?.status === 429 ? "Rate limit exceeded." : error.message || "Failed to load data.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchListeningData();
  }, [token]);

  // Section 2 Handler: Total Time Listened
  const handleTimePeriodChange = (period) => {
    setSelectedPeriodTime(period);
    const now = new Date();
    if (period === "day") {
      const startOfDay = new Date(now).setHours(0, 0, 0, 0);
      const timeByHour = recentTracks.reduce((acc, item) => {
        const playedAt = new Date(item.played_at);
        if (playedAt >= startOfDay) {
          const hour = playedAt.getHours();
          acc[hour] = (acc[hour] || 0) + item.track.duration_ms / 60000; // Convert ms to minutes
        }
        return acc;
      }, {});
      const data = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        minutes: timeByHour[i] || 0,
      }));
      setListeningTime(data);
      const peakHour = data.reduce((max, d) => (d.minutes > max.minutes ? d : max), { hour: "", minutes: 0 });
      setInsights(prev => ({
        ...prev,
        peakTime: peakHour.minutes > 0 ? `Peak: ${peakHour.hour} (${peakHour.minutes.toFixed(1)} mins)` : "No listening today.",
      }));
    } else if (period === "week") {
      const timeByDay = recentTracks.reduce((acc, item) => {
        const playedAt = new Date(item.played_at);
        const dayName = playedAt.toLocaleString("en-US", { weekday: "short" });
        if (playedAt > new Date(now - 7 * 24 * 60 * 60 * 1000)) {
          acc[dayName] = (acc[dayName] || 0) + item.track.duration_ms / 60000;
        }
        return acc;
      }, {});
      const data = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => ({
        day,
        minutes: timeByDay[day] || 0,
      }));
      setListeningTime(data);
      const peakDay = data.reduce((max, d) => (d.minutes > max.minutes ? d : max), { day: "", minutes: 0 });
      setInsights(prev => ({
        ...prev,
        peakTime: peakDay.minutes > 0 ? `Peak: ${peakDay.day} (${peakDay.minutes.toFixed(1)} mins)` : "No listening this week.",
      }));
    } else {
      const timeByWeek = recentTracks.reduce((acc, item) => {
        const playedAt = new Date(item.played_at);
        const daysAgo = Math.floor((now - playedAt) / (24 * 60 * 60 * 1000));
        const weekNum = Math.min(3, Math.floor(daysAgo / 7));
        acc[weekNum] = (acc[weekNum] || 0) + item.track.duration_ms / 60000;
        return acc;
      }, {});
      const data = Array.from({ length: 4 }, (_, i) => ({
        week: `Week ${4 - i}`,
        minutes: timeByWeek[i] || 0,
      })).reverse();
      setListeningTime(data);
      const peakWeek = data.reduce((max, w) => (w.minutes > max.minutes ? w : max), { week: "", minutes: 0 });
      setInsights(prev => ({
        ...prev,
        peakTime: peakWeek.minutes > 0 ? `Peak: ${peakWeek.week} (${peakWeek.minutes.toFixed(1)} mins)` : "No listening this month.",
      }));
    }
  };

  // Section 3 Handler: Total Tracks Played
  const handlePeriodChange = (period) => {
    setSelectedPeriodWeekly(period);
    const now = new Date();
    if (period === "day") {
      const startOfDay = new Date(now).setHours(0, 0, 0, 0);
      const data = Array.from({ length: 24 }, (_, i) => {
        const hourStart = new Date(startOfDay + i * 60 * 60 * 1000);
        const hourEnd = new Date(hourStart + 60 * 60 * 1000);
        const tracks = recentTracks.reduce((acc, item) => {
          const playedAt = new Date(item.played_at);
          if (playedAt >= hourStart && playedAt < hourEnd) {
            return acc + 1;
          }
          return acc;
        }, 0);
        return { date: `${i}:00`, tracks };
      });
      setWeeklyListening(data);
      const peakHour = data.reduce((max, d) => (d.tracks > max.tracks ? d : max), { date: "", tracks: 0 });
      setInsights(prev => ({
        ...prev,
        peakListeningDay: peakHour.tracks > 0 ? `Peak: ${peakHour.date} (${peakHour.tracks} tracks)` : "No tracks today.",
      }));
    } else if (period === "week") {
      const data = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split("T")[0];
        const tracks = recentTracks.reduce((acc, item) => {
          const playedAt = new Date(item.played_at);
          if (playedAt.toISOString().split("T")[0] === dateStr) {
            return acc + 1;
          }
          return acc;
        }, 0);
        return { date: dateStr, tracks };
      }).reverse();
      setWeeklyListening(data);
      const peakDay = data.reduce((max, d) => (d.tracks > max.tracks ? d : max), { date: "", tracks: 0 });
      setInsights(prev => ({
        ...prev,
        peakListeningDay: peakDay.tracks > 0 ? `Peak: ${peakDay.date} (${peakDay.tracks} tracks)` : "Not enough data.",
      }));
    } else {
      const data = Array.from({ length: 4 }, (_, i) => {
        const weekStart = new Date(now - (i + 1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(now - i * 7 * 24 * 60 * 60 * 1000);
        const tracks = recentTracks.reduce((acc, item) => {
          const playedAt = new Date(item.played_at);
          if (playedAt >= weekStart && playedAt < weekEnd) {
            return acc + 1;
          }
          return acc;
        }, 0);
        return { date: `Week ${4 - i}`, tracks };
      }).reverse();
      setWeeklyListening(data);
      const peakWeek = data.reduce((max, w) => (w.tracks > max.tracks ? w : max), { date: "", tracks: 0 });
      setInsights(prev => ({
        ...prev,
        peakListeningDay: peakWeek.tracks > 0 ? `Peak: ${peakWeek.date} (${peakWeek.tracks} tracks)` : "Not enough data.",
      }));
    }
  };

  // Section 5 Handler: Artist Trends
  const handleArtistPeriodChange = (period) => {
    setSelectedPeriodArtists(period);
    const now = new Date();
    let days;

    if (period === "day") {
      days = 1;
      const startOfDay = new Date(now).setHours(0, 0, 0, 0);
      const artistHourlyPlays = recentTracks.reduce((acc, item) => {
        const playedAt = new Date(item.played_at);
        if (playedAt >= startOfDay) {
          const hour = playedAt.getHours();
          const artistName = item.track.artists[0].name;
          if (!acc[artistName]) acc[artistName] = {};
          acc[artistName][hour] = (acc[artistName][hour] || 0) + 1;
        }
        return acc;
      }, {});
      const trendData = Array.from({ length: 24 }, (_, i) => {
        const hourStart = new Date(startOfDay + i * 60 * 60 * 1000);
        const hourStr = `${i}:00`;
        const dayData = { hour: hourStr };
        topArtists.forEach(artist => {
          dayData[artist.name] = artistHourlyPlays[artist.name]?.[i] || 0;
        });
        return dayData;
      });
      setArtistTrends(trendData);
      const topArtist = topArtists[0]?.name || "None";
      const topPlays = trendData.reduce((sum, day) => sum + (day[topArtist] || 0), 0);
      setInsights(prev => ({
        ...prev,
        topArtistTrend: topPlays > 0 ? `${topArtist} leads with ${topPlays} plays today.` : "No standout artist today.",
      }));
    } else if (period === "week") {
      days = 7;
      const startOfPeriod = new Date(now - days * 24 * 60 * 60 * 1000);
      const artistDailyPlays = recentTracks.reduce((acc, item) => {
        const playedAt = new Date(item.played_at);
        if (playedAt >= startOfPeriod) {
          const dateStr = playedAt.toISOString().split("T")[0];
          const artistName = item.track.artists[0].name;
          if (!acc[artistName]) acc[artistName] = {};
          acc[artistName][dateStr] = (acc[artistName][dateStr] || 0) + 1;
        }
        return acc;
      }, {});
      const trendData = Array.from({ length: days }, (_, i) => {
        const date = new Date(startOfPeriod.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split("T")[0];
        const dayData = { date: dateStr };
        topArtists.forEach(artist => {
          dayData[artist.name] = artistDailyPlays[artist.name]?.[dateStr] || 0;
        });
        return dayData;
      });
      setArtistTrends(trendData);
      const topArtist = topArtists[0]?.name || "None";
      const topPlays = trendData.reduce((sum, day) => sum + (day[topArtist] || 0), 0);
      setInsights(prev => ({
        ...prev,
        topArtistTrend: topPlays > 0 ? `${topArtist} leads with ${topPlays} plays this week.` : "No standout artist this week.",
      }));
    } else {
      days = 30;
      const startOfPeriod = new Date(now - days * 24 * 60 * 60 * 1000);
      const artistDailyPlays = recentTracks.reduce((acc, item) => {
        const playedAt = new Date(item.played_at);
        if (playedAt >= startOfPeriod) {
          const dateStr = playedAt.toISOString().split("T")[0];
          const artistName = item.track.artists[0].name;
          if (!acc[artistName]) acc[artistName] = {};
          acc[artistName][dateStr] = (acc[artistName][dateStr] || 0) + 1;
        }
        return acc;
      }, {});
      const trendData = Array.from({ length: days }, (_, i) => {
        const date = new Date(startOfPeriod.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split("T")[0];
        const dayData = { date: dateStr };
        topArtists.forEach(artist => {
          dayData[artist.name] = artistDailyPlays[artist.name]?.[dateStr] || 0;
        });
        return dayData;
      });
      setArtistTrends(trendData);
      const topArtist = topArtists[0]?.name || "None";
      const topPlays = trendData.reduce((sum, day) => sum + (day[topArtist] || 0), 0);
      setInsights(prev => ({
        ...prev,
        topArtistTrend: topPlays > 0 ? `${topArtist} leads with ${topPlays} plays this month.` : "No standout artist this month.",
      }));
    }
  };

  return (
    <div className="flex-1 overflow-auto relative z-10 bg-black">
      <Header title="My Listening" />
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {loading ? (
          <div className="text-center text-gray-400">Loading your listening data...</div>
        ) : error ? (
          <div className="text-center text-red-400">{error}</div>
        ) : (
          <>
            {/* Section 1: Listening Summary */}
            <motion.div className="glass-card p-6 mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h2 className="text-xl font-semibold text-white mb-4">Your Music Snapshot</h2>
              <p className="text-gray-300 mb-4">Your top tracks and recent plays.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Top Tracks</h3>
                  <ul className="space-y-2 text-gray-400">
                    {topTracks.slice(0, 5).map(track => (
                      <li key={track.id} className="flex items-center">
                        <img src={track.album.images[2]?.url || "https://via.placeholder.com/48"} alt={track.name} className="w-10 h-10 mr-2 rounded" />
                        <span>{track.name} by {track.artists[0].name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Recently Played</h3>
                  <ul className="space-y-2 text-gray-400">
                    {recentTracks.slice(0, 5).map(track => (
                      <li key={track.track.id} className="flex items-center">
                        <img src={track.track.album.images[2]?.url || "https://via.placeholder.com/48"} alt={track.track.name} className="w-10 h-10 mr-2 rounded" />
                        <span>{track.track.name} by {track.track.artists[0].name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Section 2: Total Time Listened */}
            <motion.div className="glass-card p-6 mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h3 className="text-lg font-medium text-white mb-2">Total Time Listened</h3>
              <div className="flex space-x-4 mb-4">
                {["day", "week", "month"].map(period => (
                  <button
                    key={period}
                    className={`px-4 py-2 rounded ${selectedPeriodTime === period ? "bg-green-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
                    onClick={() => handleTimePeriodChange(period)}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-gray-300 mb-4">{insights.peakTime}</p>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={listeningTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey={selectedPeriodTime === "day" ? "hour" : selectedPeriodTime === "week" ? "day" : "week"} stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" label={{ value: "Minutes Listened", angle: -90, position: "insideLeft" }} />
                  <Tooltip formatter={(value) => `${value.toFixed(1)} mins`} />
                  <Line type="monotone" dataKey="minutes" stroke="#1DB954" />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Section 3: Total Tracks Played */}
            <motion.div className="glass-card p-6 mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h3 className="text-lg font-medium text-white mb-2">Total Tracks Played</h3>
              <div className="flex space-x-4 mb-4">
                {["day", "week", "month"].map(period => (
                  <button
                    key={period}
                    className={`px-4 py-2 rounded ${selectedPeriodWeekly === period ? "bg-green-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
                    onClick={() => handlePeriodChange(period)}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-gray-300 mb-4">{insights.peakListeningDay}</p>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyListening}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" label={{ value: "Tracks Played", angle: -90, position: "insideLeft" }} />
                  <Tooltip formatter={(value) => `${value} tracks`} />
                  <Line type="monotone" dataKey="tracks" stroke="#FF6B6B" />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Section 4: How Much Do You Repeat Songs? */}
            <motion.div className="glass-card p-6 mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <h3 className="text-lg font-medium text-white mb-2">How Much Do You Repeat Songs?</h3>
              <p className="text-gray-300 mb-4">{insights.consistency}</p>
              <button
                className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                onClick={() => setShowConsistencyDetails(!showConsistencyDetails)}
              >
                {showConsistencyDetails ? "Hide Details" : "Show Repeated Tracks"}
              </button>
              {showConsistencyDetails && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                  <h4 className="text-md font-medium text-white mb-2">Your Repeated Tracks</h4>
                  {consistencyDetails.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={consistencyDetails} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis type="number" stroke="#9CA3AF" label={{ value: "Times Played", position: "insideBottom", offset: -5 }} />
                        <YAxis type="category" dataKey="name" stroke="#9CA3AF" width={200} fontSize={12} interval={0} />
                        <Tooltip formatter={(value) => `${value} plays`} />
                        <Bar dataKey="repeats" fill="#FED766" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-400">No songs repeated in your last 50 plays.</p>
                  )}
                </motion.div>
              )}
            </motion.div>

            {/* Section 5: Your Artist Trends */}
            <motion.div className="glass-card p-6 mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
              <h2 className="text-xl font-semibold text-white mb-4">Your Artist Trends</h2>
              <div className="flex space-x-4 mb-4">
                {["day", "week", "month"].map(period => (
                  <button
                    key={period}
                    className={`px-4 py-2 rounded ${selectedPeriodArtists === period ? "bg-green-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
                    onClick={() => handleArtistPeriodChange(period)}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-gray-300 mb-4">{insights.topArtistTrend}</p>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={artistTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey={selectedPeriodArtists === "day" ? "hour" : "date"} stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" label={{ value: "Tracks Played", angle: -90, position: "insideLeft" }} />
                  <Tooltip formatter={(value) => `${value} tracks`} />
                  {topArtists.map((artist, i) => (
                    <Area
                      key={artist.name}
                      type="monotone"
                      dataKey={artist.name}
                      stackId="1"
                      stroke={COLORS[i % COLORS.length]}
                      fill={COLORS[i % COLORS.length]}
                      fillOpacity={0.3}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Section 6: Music Travel Map */}
            <motion.div className="glass-card p-6 mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
              <h2 className="text-xl font-semibold text-white mb-4">Music Travel Map</h2>
              <p className="text-gray-300 mb-4">Explore your music by genre and country.</p>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-white mb-2">Select Genre</h3>
                <div className="flex space-x-4">
                  {Object.keys(GENRE_COUNTRY_MAP).map(g => (
                    <button
                      key={g}
                      className={`px-4 py-2 rounded ${travelGenre === g ? "bg-green-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
                      onClick={() => {
                        setTravelGenre(g);
                        setTravelCountries(GENRE_COUNTRY_MAP[g]);
                        setCountryArtists([]);
                        setArtistPopularity(null);
                      }}
                    >
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {travelGenre && (
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-white mb-2">Select Country</h3>
                  <div className="flex space-x-4 mb-4">
                    {travelCountries.map(c => (
                      <button
                        key={c}
                        className={`px-4 py-2 rounded ${countryArtists.some(a => a.country === c) ? "bg-green-500 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
                        onClick={() => {
                          const artists = topArtists
                            .map(a => ({
                              name: a.name,
                              value: recentTracks.filter(t => t.track.artists[0].name === a.name).length,
                              popularity: a.popularity,
                              country: GENRE_COUNTRY_MAP[travelGenre].includes(c) ? c : "Unknown",
                            }))
                            .filter(a => a.country === c);
                          setCountryArtists(artists);
                          setArtistPopularity(null);
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <MapContainer center={[20, 0]} zoom={2} style={{ height: "100%", width: "100%" }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      {travelCountries.map(c => (
                        <Marker key={c} position={COUNTRY_COORDS[c] || [0, 0]}>
                          <Popup>
                            {c}: {countryArtists.filter(a => a.country === c).length} artists
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </ResponsiveContainer>
                </div>
              )}
              {countryArtists.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-white mb-2">Artists</h3>
                  <ul className="space-y-2 text-gray-400 max-h-40 overflow-y-auto">
                    {countryArtists.map(a => (
                      <li
                        key={a.name}
                        className="cursor-pointer hover:text-white"
                        onClick={() => {
                          const yourPlays = recentTracks.filter(t => t.track.artists[0].name === a.name).length;
                          setArtistPopularity({ yourPlays, globalPopularity: a.popularity });
                        }}
                      >
                        {a.name} ({a.value} plays)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {artistPopularity && (
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Popularity Details</h3>
                  <p className="text-gray-300">Your Plays: {artistPopularity.yourPlays}</p>
                  <p className="text-gray-300">Global Popularity: {artistPopularity.globalPopularity}/100</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
};

export default MyListeningPage;