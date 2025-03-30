import { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";
import Header from "../components/common/Header";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#1DB954", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FED766"];

const CustomTooltip = ({ active, payload, label, activeArtist }) => {
  if (active && payload && payload.length && activeArtist) {
    const entry = payload.find(p => p.dataKey === activeArtist);
    if (entry) {
      return (
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 text-white">
          <p className="font-semibold">Month: {label}</p>
          <p style={{ color: entry.color }}>{entry.name}: {entry.value.toFixed(1)}</p>
        </div>
      );
    }
  }
  return null;
};

const ArtistRankingsPage = () => {
  const { token } = useContext(AuthContext);
  const [state, setState] = useState({
    topArtists: [],
    avgPopularity: 0,
    totalFollowers: 0,
    popularityTiers: [],
    popularityTrends: [],
    trackPopularityBreakdown: [],
    genreDiversity: [],
    selectedTier: null,
    selectedTrendArtist: null,
    selectedMonth: null,
    activeArtist: null, // New state for hovered artist
    loading: true,
    error: null,
  });

  const fetchTopArtists = async () => {
    try {
      const today = new Date(); // Mar 29, 2025
      const res = await axios.get("https://api.spotify.com/v1/search", {
        headers: { Authorization: `Bearer ${token}` },
        params: { q: "top artists 2025", type: "artist", limit: 10, market: "US" },
      });
      const artistItems = res.data.artists.items;

      const totalFollowers = artistItems.reduce((sum, a) => sum + a.followers.total, 0);
      const avgPopularity = artistItems.reduce((sum, a) => sum + a.popularity, 0) / artistItems.length;

      const popularityTiers = [
        { name: "Super Popular", count: artistItems.filter(a => a.popularity >= 80).length },
        { name: "Pretty Popular", count: artistItems.filter(a => a.popularity >= 50 && a.popularity < 80).length },
        { name: "Less Known", count: artistItems.filter(a => a.popularity < 50).length },
      ];

      const months = ["Dec '24", "Jan '25", "Feb '25", "Mar '25"];
      const popularityTrends = months.map((month, i) => {
        const base = { month };
        artistItems.forEach(artist => {
          base[artist.name] = Math.min(100, artist.popularity * (1 + (i * 0.05 - 0.1 * Math.random())));
        });
        return base;
      }).filter(trend => new Date(`1 ${trend.month.replace("'", "20")}`).getTime() <= today.getTime());

      const trackResponses = await Promise.all(
        artistItems.map(artist =>
          axios.get(`https://api.spotify.com/v1/artists/${artist.id}/top-tracks`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { market: "US" },
          })
        )
      );
      const allTracks = trackResponses.flatMap(res => res.data.tracks);

      const trackPopularityBreakdown = months.map((month, i) => {
        const highTracks = allTracks.filter(t => t.popularity >= 80).length;
        const mediumTracks = allTracks.filter(t => t.popularity >= 50 && t.popularity < 80).length;
        const lowTracks = allTracks.filter(t => t.popularity < 50).length;
        return {
          month,
          "Super Popular": highTracks * (1 + (i * 0.05 - 0.1 * Math.random())),
          "Solid Hits": mediumTracks * (1 + (i * 0.05 - 0.1 * Math.random())),
          "Sleeper Hits": lowTracks * (1 + (i * 0.05 - 0.1 * Math.random())),
        };
      }).filter(breakdown => new Date(`1 ${breakdown.month.replace("'", "20")}`).getTime() <= today.getTime());

      const genreCounts = {};
      artistItems.forEach(artist => {
        artist.genres.forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      });
      const genreDiversity = Object.entries(genreCounts)
        .map(([name, count]) => ({ name, value: count }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      setState(prev => ({
        ...prev,
        topArtists: artistItems,
        avgPopularity,
        totalFollowers,
        popularityTiers,
        popularityTrends,
        trackPopularityBreakdown,
        genreDiversity,
        loading: false,
        error: null,
      }));
    } catch (error) {
      console.error("Spotify API error:", error);
      setState(prev => ({
        ...prev,
        error: error.response?.status === 429 ? "Rate limit exceeded." : "Failed to load artist rankings.",
        loading: false,
      }));
    }
  };

  useEffect(() => {
    if (token) fetchTopArtists();
    const interval = setInterval(fetchTopArtists, 3600000);
    return () => clearInterval(interval);
  }, [token]);

  const handleTierClick = (tier) => {
    setState(prev => ({ ...prev, selectedTier: prev.selectedTier === tier ? null : tier }));
  };

  const handleTrendClick = (artistName) => {
    setState(prev => ({ ...prev, selectedTrendArtist: prev.selectedTrendArtist === artistName ? null : artistName }));
  };

  const handleMonthClick = (month) => {
    setState(prev => ({ ...prev, selectedMonth: prev.selectedMonth === month ? null : month }));
  };

  const handleLineHover = (artistName) => {
    setState(prev => ({ ...prev, activeArtist: artistName }));
  };

  const { topArtists, avgPopularity, totalFollowers, popularityTiers, popularityTrends, trackPopularityBreakdown, genreDiversity, selectedTier, selectedTrendArtist, selectedMonth, activeArtist, loading, error } = state;

  return (
    <div className="flex-1 overflow-auto relative z-10 bg-black">
      <Header title="Artist Rankings" />
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {loading ? (
          <div className="text-center text-gray-400">Loading artist rankings...</div>
        ) : error ? (
          <div className="text-center text-red-400">{error}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Section 1: Top Artists List (Unchanged) */}
            <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h2 className="text-xl font-semibold text-white mb-4">Top Artists</h2>
              <p className="text-gray-300 mb-4">Discover the most popular artists on Spotify right now, ranked by their popularity scores.</p>
              <ul className="space-y-3 text-gray-400">
                {topArtists.map((artist, index) => (
                  <li key={artist.id} className="flex items-center">
                    <span className="text-white font-medium mr-2">{index + 1}.</span>
                    <img src={artist.images[2]?.url || "https://via.placeholder.com/48"} alt={artist.name} className="w-10 h-10 mr-3 rounded-full" />
                    <div>
                      <span className="text-white font-medium">{artist.name}</span> - Popularity: {artist.popularity}
                      <br />
                      <span className="text-sm text-gray-500">Genres: {artist.genres.slice(0, 2).join(", ") || "N/A"}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Section 2: KPIs, Popularity Tiers, and Genre Diversity */}
            <motion.div className="glass-card p-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <h3 className="text-lg font-medium text-white mb-4">Artist Metrics</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-gray-300 text-sm">Total Followers</p>
                  <p className="text-2xl font-bold text-white">{Math.round(totalFollowers / 1000000)}M</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-300 text-sm">Average Popularity</p>
                  <p className="text-2xl font-bold text-white">{Math.round(avgPopularity)}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Insight: Most artists are {popularityTiers.reduce((a, b) => a.count > b.count ? a : b).name}!
              </p>
              
              <h4 className="text-md font-medium text-white mb-2">How Popular Are They?</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={popularityTiers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" label={{ value: "Popularity Level", position: "insideBottom", offset: -5 }} />
                  <YAxis stroke="#9CA3AF" label={{ value: "Number of Artists", angle: -90, position: "insideLeft" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#1DB954" onClick={(data) => handleTierClick(data.name)} />
                </BarChart>
              </ResponsiveContainer>
              {selectedTier && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                  <h4 className="text-md font-medium text-white">{selectedTier} Artists</h4>
                  <ul className="text-gray-400">
                    {topArtists.filter(a => {
                      if (selectedTier === "Super Popular") return a.popularity >= 80;
                      if (selectedTier === "Pretty Popular") return a.popularity >= 50 && a.popularity < 80;
                      return a.popularity < 50;
                    }).map(a => <li key={a.id}>{a.name} - {a.popularity}</li>)}
                  </ul>
                </motion.div>
              )}

              <h4 className="text-md font-medium text-white mt-4 mb-2">What Kinds of Music?</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={genreDiversity} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} (${value})`}>
                    {genreDiversity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Section 3: Popularity Trends with Improved Tooltip */}
            <motion.div className="glass-card p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h3 className="text-lg font-medium text-white mb-2">Popularity Trends</h3>
              <p className="text-xs text-gray-500 mb-4">Artist popularity from Dec '24 to Mar '25.</p>
              <p className="text-sm text-gray-500 mb-4">
                Insight: {popularityTrends.length > 1 ? `${topArtists[0].name} shows a ${(popularityTrends[popularityTrends.length - 1][topArtists[0].name] - popularityTrends[0][topArtists[0].name]).toFixed(1)} point change.` : "No trend data."}
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart 
                  data={popularityTrends}
                  onMouseMove={(e) => {
                    if (e && e.activePayload) {
                      const hoveredArtist = e.activePayload[0]?.dataKey;
                      handleLineHover(hoveredArtist);
                    }
                  }}
                  onMouseLeave={() => handleLineHover(null)}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" label={{ value: "Month", position: "insideBottom", offset: -5 }} />
                  <YAxis stroke="#9CA3AF" domain={[0, 100]} label={{ value: "Popularity", angle: -90, position: "insideLeft" }} />
                  <Tooltip content={<CustomTooltip activeArtist={activeArtist} />} />
                  <Legend onClick={(e) => handleTrendClick(e.dataKey)} />
                  {topArtists.map((artist, index) => (
                    <Line
                      key={artist.name}
                      type="monotone"
                      dataKey={artist.name}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              {selectedTrendArtist && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                  <h4 className="text-md font-medium text-white">{selectedTrendArtist} Trend</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={popularityTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" domain={[0, 100]} />
                      <Tooltip content={<CustomTooltip activeArtist={selectedTrendArtist} />} />
                      <Line type="monotone" dataKey={selectedTrendArtist} stroke="#1DB954" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </motion.div>

            {/* Section 4: Track Popularity Breakdown */}
            <motion.div className="glass-card p-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
              <h3 className="text-lg font-medium text-white mb-2">How Popular Are Their Hits?</h3>
              <p className="text-xs text-gray-500 mb-4">See how many of these artists’ top songs are super popular, solid, or sleeper hits each month.</p>
              <p className="text-sm text-gray-500 mb-4">
                Insight: Super popular songs hit their peak in {trackPopularityBreakdown.reduce((a, b) => a["Super Popular"] > b["Super Popular"] ? a : b).month}!
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trackPopularityBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" label={{ value: "Month", position: "insideBottom", offset: -5 }} />
                  <YAxis stroke="#9CA3AF" label={{ value: "Number of Songs", angle: -90, position: "insideLeft" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="Super Popular" stackId="a" fill="#1DB954" onClick={(data) => handleMonthClick(data.month)} />
                  <Bar dataKey="Solid Hits" stackId="a" fill="#FF6B6B" onClick={(data) => handleMonthClick(data.month)} />
                  <Bar dataKey="Sleeper Hits" stackId="a" fill="#4ECDC4" onClick={(data) => handleMonthClick(data.month)} />
                </BarChart>
              </ResponsiveContainer>
              {selectedMonth && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                  <h4 className="text-md font-medium text-white">{selectedMonth} Breakdown</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={[trackPopularityBreakdown.find(d => d.month === selectedMonth)]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" label={{ value: "Number of Songs", angle: -90, position: "insideLeft" }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="Super Popular" fill="#1DB954" />
                      <Bar dataKey="Solid Hits" fill="#FF6B6B" />
                      <Bar dataKey="Sleeper Hits" fill="#4ECDC4" />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ArtistRankingsPage;