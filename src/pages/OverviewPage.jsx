import { useContext, useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";
import Header from "../components/common/Header";
import StatCard from "../components/common/StatCard";
import { Headphones, Globe, Music, TrendingUp } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = ["#1DB954", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FED766"];

const OverviewPage = () => {
  const { token } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalStreams: "1.5B",
    activeUsers: "500M",
    uniqueGenres: "Loading...",
    recentReleases: "Loading...",
  });
  const [insights, setInsights] = useState({
    genreDominance: [],
    releaseTrends: [],
    releaseTypes: [],
    artistProductivity: [],
  });
  const [releaseInsights, setReleaseInsights] = useState({
    avgTracks: 0,
    trackBreakdown: [],
    mostActiveDay: { day: "N/A", count: 0, releases: [] },
    genreDiversity: 0,
    genreBreakdown: [],
    recentTypeRatio: { singles: 0, albums: 0, singlesList: [], albumsList: [] },
    emergingArtistsByMonth: [],
  });
  const [glanceData, setGlanceData] = useState({ topGenre: "", busiestArtist: "", latestRelease: "" });
  const [userName, setUserName] = useState("User");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [drillDown, setDrillDown] = useState({ type: null, value: null });
  const [drillDownInsight, setDrillDownInsight] = useState(null);
  const [allReleases, setAllReleases] = useState([]);
  const [topSongs, setTopSongs] = useState([]); // New state for individual songs

  const fallbackInsights = {
    genreDominance: [{ name: "N/A", value: 1 }],
    releaseTrends: [{ name: "N/A", value: 1 }],
    releaseTypes: [{ name: "N/A", value: 1 }],
    artistProductivity: [{ name: "N/A", count: 1 }],
  };

  const formatReleaseDate = (date, precision) => {
    if (!date || date === "N/A") return "Unknown Date";
    const dateObj = new Date(date);
    switch (precision) {
      case "day":
        return dateObj.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      case "month":
        return dateObj.toLocaleDateString("en-US", { year: "numeric", month: "long" });
      case "year":
        return dateObj.getFullYear().toString();
      default:
        return "Unknown Date";
    }
  };

  const sortReleasesByDate = (a, b) => {
    const dateA = a.release_date && a.release_date !== "N/A" ? new Date(a.release_date) : new Date(0);
    const dateB = b.release_date && b.release_date !== "N/A" ? new Date(b.release_date) : new Date(0);
    return dateB - dateA;
  };

  const fetchData = async () => {
    try {
      try {
        const userRes = await axios.get("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserName(userRes.data.display_name || "User");
      } catch (userError) {
        console.warn("Failed to fetch user data:", userError.response?.data || userError.message);
        setUserName("User");
      }

      const releasesRes = await axios.get("https://api.spotify.com/v1/browse/new-releases", {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 50 },
      });
      const releases = releasesRes.data.albums?.items?.map(album => ({
        id: album.id, // Add ID for fetching tracks
        name: album.name || "Unknown Release",
        artist: album.artists?.[0]?.name || "Unknown Artist",
        artistId: album.artists?.[0]?.id || "unknown",
        release_date: album.release_date || "N/A",
        release_date_precision: album.release_date_precision || "unknown",
        total_tracks: album.total_tracks || 0,
        type: album.album_type || "unknown",
        genres: [],
      })) || [];

      if (releases.length === 0) throw new Error("No releases returned from API");

      // Fetch tracks for each release
      const songs = [];
      for (const release of releases.sort(sortReleasesByDate)) {
        const tracksRes = await axios.get(`https://api.spotify.com/v1/albums/${release.id}/tracks`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 50 }, // Max tracks per album
        });
        const releaseTracks = tracksRes.data.items.map(track => ({
          name: track.name || "Unknown Song",
          artist: release.artist,
          release_date: release.release_date,
          release_date_precision: release.release_date_precision,
        }));
        songs.push(...releaseTracks);
        if (songs.length >= 50) break; // Stop once we have 50 songs
      }
      setTopSongs(songs.slice(0, 50)); // Limit to 50 songs

      const artistIds = [...new Set(releases.map(r => r.artistId).filter(id => id !== "unknown"))];
      const artistBatches = [];
      for (let i = 0; i < artistIds.length; i += 50) {
        artistBatches.push(artistIds.slice(i, i + 50));
      }
      const artistGenres = {};
      for (const batch of artistBatches) {
        const artistsRes = await axios.get(
          `https://api.spotify.com/v1/artists?ids=${batch.join(',')}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        artistsRes.data.artists?.forEach(a => {
          artistGenres[a.id] = a.genres?.map(g => g.toLowerCase()) || [];
        });
      }
      releases.forEach(r => {
        r.genres = artistGenres[r.artistId] || [];
      });
      setAllReleases(releases);

      const genreCount = {};
      releases.forEach(r => {
        r.genres.forEach(g => {
          genreCount[g] = (genreCount[g] || 0) + 1;
        });
      });
      const genreDominance = Object.entries(genreCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name: name || "Other", value }));

      const today = new Date();
      const oneWeekAgo = new Date(today); oneWeekAgo.setDate(today.getDate() - 7);
      const oneMonthAgo = new Date(today); oneMonthAgo.setMonth(today.getMonth() - 1);
      const releaseTrends = [
        { name: "Last Week", value: releases.filter(r => r.release_date !== "N/A" && new Date(r.release_date) >= oneWeekAgo).length },
        { name: "Last Month", value: releases.filter(r => r.release_date !== "N/A" && new Date(r.release_date) >= oneMonthAgo && new Date(r.release_date) < oneWeekAgo).length },
        { name: "Older", value: releases.filter(r => r.release_date !== "N/A" && new Date(r.release_date) < oneMonthAgo).length },
        { name: "Unknown", value: releases.filter(r => r.release_date === "N/A").length },
      ].filter(t => t.value > 0);

      const releaseTypes = [
        { name: "Singles", value: releases.filter(r => r.type === "single").length },
        { name: "Albums", value: releases.filter(r => r.type === "album").length },
      ].filter(t => t.value > 0);

      const artistCount = {};
      releases.forEach(r => {
        artistCount[r.artist] = (artistCount[r.artist] || 0) + 1;
      });
      const artistProductivity = Object.entries(artistCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name: name || "Unknown", count }));

      setInsights({
        genreDominance: genreDominance.length > 0 ? genreDominance : [{ name: "N/A", value: 1 }],
        releaseTrends: releaseTrends.length > 0 ? releaseTrends : [{ name: "N/A", value: 1 }],
        releaseTypes: releaseTypes.length > 0 ? releaseTypes : [{ name: "N/A", value: 1 }],
        artistProductivity: artistProductivity.length > 0 ? artistProductivity : [{ name: "N/A", count: 1 }],
      });

      const avgTracks = releases.length > 0 ? (releases.reduce((sum, r) => sum + r.total_tracks, 0) / releases.length).toFixed(1) : 0;
      const trackBreakdown = [
        { name: "1-3 tracks", value: releases.filter(r => r.total_tracks >= 1 && r.total_tracks <= 3).length },
        { name: "4-6 tracks", value: releases.filter(r => r.total_tracks >= 4 && r.total_tracks <= 6).length },
        { name: "7+ tracks", value: releases.filter(r => r.total_tracks >= 7).length },
      ].filter(t => t.value > 0);

      const dayCount = {};
      const dayReleases = {};
      releases
        .filter(r => r.release_date !== "N/A" && r.release_date_precision === "day")
        .forEach(r => {
          const day = new Date(r.release_date).toLocaleDateString("en-US", { weekday: "long" });
          dayCount[day] = (dayCount[day] || 0) + 1;
          dayReleases[day] = (dayReleases[day] || []).concat(r);
        });
      const mostActiveDayEntry = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0] || ["N/A", 0];
      const mostActiveDay = {
        day: mostActiveDayEntry[0],
        count: mostActiveDayEntry[1],
        releases: dayReleases[mostActiveDayEntry[0]] || [],
      };

      const genreDiversity = releases.length > 0
        ? (releases.filter(r => r.genres.length > 1).length / releases.length * 100).toFixed(1)
        : 0;
      const genreBreakdown = [
        { name: "Single Genre", value: releases.filter(r => r.genres.length === 1).length },
        { name: "Multi-Genre", value: releases.filter(r => r.genres.length > 1).length },
      ].filter(t => t.value > 0);

      const recentReleases = releases.filter(r => r.release_date !== "N/A" && new Date(r.release_date) >= oneWeekAgo);
      const recentSingles = recentReleases.filter(r => r.type === "single");
      const recentAlbums = recentReleases.filter(r => r.type === "album");
      const totalRecent = recentSingles.length + recentAlbums.length;
      const recentTypeRatio = {
        singles: totalRecent > 0 ? (recentSingles.length / totalRecent * 100).toFixed(1) : 0,
        albums: totalRecent > 0 ? (recentAlbums.length / totalRecent * 100).toFixed(1) : 0,
        singlesList: recentSingles,
        albumsList: recentAlbums,
      };

      const emergingArtists = Object.entries(artistCount)
        .filter(([_, count]) => count === 1)
        .map(([artist]) => artist);
      const emergingByMonth = {};
      releases
        .filter(r => emergingArtists.includes(r.artist) && r.release_date !== "N/A")
        .forEach(r => {
          const date = new Date(r.release_date);
          const monthKey = date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
          if (!emergingByMonth[monthKey]) {
            emergingByMonth[monthKey] = { count: 0, artists: [] };
          }
          if (!emergingByMonth[monthKey].artists.includes(r.artist)) {
            emergingByMonth[monthKey].artists.push(r.artist);
            emergingByMonth[monthKey].count += 1;
          }
        });
      const emergingArtistsByMonth = Object.entries(emergingByMonth)
        .map(([month, { count, artists }]) => ({ month, count, artists }))
        .sort((a, b) => new Date(b.month) - new Date(a.month));

      setReleaseInsights({
        avgTracks,
        trackBreakdown,
        mostActiveDay,
        genreDiversity,
        genreBreakdown,
        recentTypeRatio,
        emergingArtistsByMonth,
      });

      setStats({
        totalStreams: "1.5B",
        activeUsers: "500M",
        uniqueGenres: Object.keys(genreCount).length.toString() || "0",
        recentReleases: releaseTrends.find(t => t.name === "Last Week")?.value.toString() || "0",
      });

      const latestRelease = releases.sort(sortReleasesByDate)[0];
      setGlanceData({
        topGenre: genreDominance[0]?.name || "N/A",
        busiestArtist: artistProductivity[0]?.name || "N/A",
        latestRelease: latestRelease?.name || "N/A",
      });

      setLoading(false);
    } catch (error) {
      console.error("API error:", error.response?.data || error.message);
      setErrorMessage(`Failed to fetch data: ${error.response?.data?.error?.message || error.message}`);
      setInsights(fallbackInsights);
      setStats({
        totalStreams: "1.5B",
        activeUsers: "500M",
        uniqueGenres: "N/A",
        recentReleases: "N/A",
      });
      setGlanceData({ topGenre: "N/A", busiestArtist: "N/A", latestRelease: "N/A" });
      setTopSongs([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      console.error("No token provided");
      setErrorMessage("Authentication token missing. Please log in.");
      setInsights(fallbackInsights);
      setStats({
        totalStreams: "1.5B",
        activeUsers: "500M",
        uniqueGenres: "N/A",
        recentReleases: "N/A",
      });
      setGlanceData({ topGenre: "N/A", busiestArtist: "N/A", latestRelease: "N/A" });
      setLoading(false);
      return;
    }
    fetchData();
  }, [token]);

  const handleGenreDrillDown = (data) => {
    if (data) {
      const genre = data.name;
      const releasesInGenre = allReleases
        .filter(r => r.genres.includes(genre.toLowerCase()))
        .sort(sortReleasesByDate)
        .slice(0, 5);
      setDrillDown({ type: "genre", value: { genre, releases: releasesInGenre } });
    }
  };

  const handleReleaseDrillDown = (data) => {
    if (data) {
      const releaseName = data.name;
      const release = allReleases.find(r => r.name === releaseName);
      if (release) {
        const artist = release.artist;
        const artistReleases = allReleases
          .filter(r => r.artist === artist)
          .sort(sortReleasesByDate);
        const typeBreakdown = [
          { name: "Singles", value: artistReleases.filter(r => r.type === "single").length },
          { name: "Albums", value: artistReleases.filter(r => r.type === "album").length },
        ].filter(t => t.value > 0);
        setDrillDown({
          type: "artist",
          value: { artist, releases: artistReleases, genres: release.genres, typeBreakdown }
        });
      }
    }
  };

  const resetDrillDown = () => {
    setDrillDown({ type: null, value: null });
  };

  const handleInsightDrillDown = (insightType, value = null) => {
    setDrillDownInsight(
      drillDownInsight && drillDownInsight.type === insightType && drillDownInsight.value === value
        ? null
        : { type: insightType, value }
    );
  };

const currentDate = new Date().toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title="Global Music Overview" />
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {loading ? (
          <div className="text-center text-gray-400">
            Loading your global music insights...
          </div>
        ) : (
          <>
            {errorMessage && (
              <div className="text-red-500 text-center mb-4">
                {errorMessage}
              </div>
            )}
            <motion.div
              className="glass-card p-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl font-semibold text-white mb-2">
                Welcome, {userName}!
              </h2>
              <p className="text-gray-300">
                Here’s your snapshot of global music trends as of {currentDate}.
                Explore new releases below!
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-8">
                <motion.div
                  className="glass-card p-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-3xl font-semibold text-white mb-4">
                    Quick Highlights
                  </h2>
                  <p className="text-gray-400 mb-4">
                    What’s trending globally right now:
                  </p>
                  <p className="text-gray-300 text-lg mb-4">
                    <strong>Latest Release:</strong>{" "}
                    <span className="text-green-500">
                      {glanceData.latestRelease}
                    </span>
                    <br />
                    <span className="text-sm text-gray-500">
                      The most recent new release worldwide
                    </span>
                  </p>
                  <p className="text-gray-300 text-lg mb-4">
                    <strong>Most Popular Genre:</strong>{" "}
                    <span className="text-green-500">
                      {glanceData.topGenre}
                    </span>
                    <br />
                    <span className="text-sm text-gray-500">
                      The genre with the most new releases
                    </span>
                  </p>
                  <p className="text-gray-300 text-lg">
                    <strong>Busiest Artist:</strong>{" "}
                    <span className="text-green-500">
                      {glanceData.busiestArtist}
                    </span>
                    <br />
                    <span className="text-sm text-gray-500">
                      Artist with the most recent releases
                    </span>
                  </p>
                </motion.div>

                <motion.div
                  className="glass-card p-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Key Stats
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <StatCard
                      name="Total Streams"
                      icon={Headphones}
                      value={stats.totalStreams}
                      definition="Estimated global streams across Spotify"
                    />
                    <StatCard
                      name="Active Users"
                      icon={Globe}
                      value={stats.activeUsers}
                      definition="Estimated monthly active listeners worldwide"
                    />
                    <StatCard
                      name="Unique Genres"
                      icon={Music}
                      value={stats.uniqueGenres}
                      definition="Number of distinct genres in recent releases"
                    />
                    <StatCard
                      name="Recent Releases"
                      icon={TrendingUp}
                      value={stats.recentReleases}
                      definition="New releases from the last 7 days"
                    />
                  </div>
                </motion.div>
              </div>

              <div className="space-y-8 lg:col-span-2">
                <motion.div
                  className="glass-card p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-lg font-medium text-white mb-4">
                    Top 50 Latest Releases
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    The latest songs from new releases worldwide, sorted by
                    release date (newest first). Use the tabs to explore
                    insights!
                  </p>
                  {/* Navbar for Insights */}
                  <div
                    className="mb-6 bg-gray-900 rounded-md p-2 flex flex-wrap gap-2"
                    style={{
                      background: "rgba(255, 255, 255, 0.07)", // Tailwind's bg-gray-900 hex value
                      // opacity: 1, // Override any inherited opacity
                    }}
                  >
                    <button
                      className={`px-3 py-1 rounded-md text-sm ${
                        drillDownInsight?.type === "avgTracks"
                          ? "bg-green-500 text-white"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                      onClick={() => handleInsightDrillDown("avgTracks")}
                    >
                      Track Lengths ({releaseInsights.avgTracks})
                    </button>
                    <button
                      className={`px-3 py-1 rounded-md text-sm ${
                        drillDownInsight?.type === "mostActiveDay"
                          ? "bg-green-500 text-white"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                      onClick={() => handleInsightDrillDown("mostActiveDay")}
                    >
                      Release Days ({releaseInsights.mostActiveDay.day}:{" "}
                      {releaseInsights.mostActiveDay.count})
                    </button>
                    <button
                      className={`px-3 py-1 rounded-md text-sm ${
                        drillDownInsight?.type === "genreDiversity"
                          ? "bg-green-500 text-white"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                      onClick={() => handleInsightDrillDown("genreDiversity")}
                    >
                      Genre Mix ({releaseInsights.genreDiversity}%)
                    </button>
                    <button
                      className={`px-3 py-1 rounded-md text-sm ${
                        drillDownInsight?.type === "recentTypeRatio"
                          ? "bg-green-500 text-white"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                      onClick={() => handleInsightDrillDown("recentTypeRatio")}
                    >
                      Recent Types ({releaseInsights.recentTypeRatio.singles}% S
                      / {releaseInsights.recentTypeRatio.albums}% A)
                    </button>
                    <button
                      className={`px-3 py-1 rounded-md text-sm ${
                        drillDownInsight?.type === "emergingArtistsByMonth" &&
                        !drillDownInsight.value
                          ? "bg-green-500 text-white"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                      onClick={() =>
                        handleInsightDrillDown("emergingArtistsByMonth")
                      }
                    >
                      New Artists
                    </button>
                    {drillDownInsight?.type === "emergingArtistsByMonth" &&
                      releaseInsights.emergingArtistsByMonth.map((entry, i) => (
                        <button
                          key={i}
                          className={`px-3 py-1 rounded-md text-sm ${
                            drillDownInsight?.value?.month === entry.month
                              ? "bg-green-500 text-white"
                              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          }`}
                          onClick={() =>
                            handleInsightDrillDown(
                              "emergingArtistsByMonth",
                              entry
                            )
                          }
                        >
                          {entry.month} ({entry.count})
                        </button>
                      ))}
                  </div>

                  {/* Drill-Down Content or Top 50 Songs */}
                  {drillDownInsight ? (
                    <div className="mb-6">
                      {drillDownInsight.type === "avgTracks" && (
                        <div>
                          <h5 className="text-white mb-2">
                            Track Count Breakdown (Avg:{" "}
                            {releaseInsights.avgTracks})
                          </h5>
                          <div style={{ width: "100%", height: 200 }}>
                            <ResponsiveContainer>
                              <BarChart data={releaseInsights.trackBreakdown}>
                                <XAxis dataKey="name" stroke="#9CA3AF" />
                                <YAxis stroke="#9CA3AF" />
                                <Tooltip />
                                <Bar dataKey="value" fill="#1DB954" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                      {drillDownInsight.type === "mostActiveDay" && (
                        <div>
                          <h5 className="text-white mb-2">
                            Releases on {releaseInsights.mostActiveDay.day} (
                            {releaseInsights.mostActiveDay.count})
                          </h5>
                          <ul className="text-gray-300 text-sm max-h-[200px] overflow-y-auto">
                            {releaseInsights.mostActiveDay.releases.map(
                              (r, i) => (
                                <li key={i}>
                                  {r.name} by {r.artist}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                      {drillDownInsight.type === "genreDiversity" && (
                        <div>
                          <h5 className="text-white mb-2">
                            Genre Breakdown ({releaseInsights.genreDiversity}%
                            Multi-Genre)
                          </h5>
                          <div style={{ width: "100%", height: 200 }}>
                            <ResponsiveContainer>
                              <PieChart>
                                <Pie
                                  data={releaseInsights.genreBreakdown}
                                  dataKey="value"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={80}
                                  label
                                >
                                  {releaseInsights.genreBreakdown.map(
                                    (entry, index) => (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                      />
                                    )
                                  )}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                      {drillDownInsight.type === "recentTypeRatio" && (
                        <div>
                          <h5 className="text-white mb-2">
                            Last Week’s Releases (
                            {releaseInsights.recentTypeRatio.singles}% Singles,{" "}
                            {releaseInsights.recentTypeRatio.albums}% Albums)
                          </h5>
                          <div className="text-gray-300 text-sm max-h-[200px] overflow-y-auto">
                            <p>
                              <strong>Singles:</strong>
                            </p>
                            <ul>
                              {releaseInsights.recentTypeRatio.singlesList.map(
                                (r, i) => (
                                  <li key={i}>
                                    {r.name} by {r.artist}
                                  </li>
                                )
                              )}
                            </ul>
                            <p className="mt-2">
                              <strong>Albums:</strong>
                            </p>
                            <ul>
                              {releaseInsights.recentTypeRatio.albumsList.map(
                                (r, i) => (
                                  <li key={i}>
                                    {r.name} by {r.artist}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        </div>
                      )}
                      {drillDownInsight.type === "emergingArtistsByMonth" &&
                        !drillDownInsight.value && (
                          <div>
                            <h5 className="text-white mb-2">
                              Emerging Artists by Month
                            </h5>
                            <div style={{ width: "100%", height: 200 }}>
                              <ResponsiveContainer>
                                <BarChart
                                  data={releaseInsights.emergingArtistsByMonth}
                                >
                                  <XAxis dataKey="month" stroke="#9CA3AF" />
                                  <YAxis stroke="#9CA3AF" />
                                  <Tooltip />
                                  <Bar dataKey="count" fill="#1DB954" />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}
                      {drillDownInsight.type === "emergingArtistsByMonth" &&
                        drillDownInsight.value && (
                          <div>
                            <h5 className="text-white mb-2">
                              Emerging Artists in {drillDownInsight.value.month}{" "}
                              ({drillDownInsight.value.count})
                            </h5>
                            <ul className="text-gray-300 text-sm max-h-[200px] overflow-y-auto">
                              {drillDownInsight.value.artists.map(
                                (artist, i) => (
                                  <li key={i}>{artist}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                      <div className="space-y-3">
                        {topSongs.length > 0 ? (
                          topSongs
                            .sort(sortReleasesByDate)
                            .map((song, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-medium truncate">
                                    {song.name}
                                  </p>
                                  <p className="text-gray-400 text-sm truncate">
                                    by {song.artist}
                                  </p>
                                </div>
                                <div className="text-right ml-4">
                                  <p className="text-gray-300 text-sm">
                                    {formatReleaseDate(
                                      song.release_date,
                                      song.release_date_precision
                                    )}
                                  </p>
                                </div>
                              </div>
                            ))
                        ) : (
                          <p className="text-gray-400 text-center">
                            No songs available
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>

                <motion.div
                  className="glass-card p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-white">
                      {drillDown.type === "genre"
                        ? `Top Releases in ${drillDown.value.genre}`
                        : drillDown.type === "artist"
                        ? `${drillDown.value.artist}'s Release Types`
                        : "Top Genres Worldwide"}
                    </h3>
                    {drillDown.type && (
                      <button
                        onClick={resetDrillDown}
                        className="text-green-500 hover:text-green-400"
                      >
                        Back to Main View
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-4">
                    {drillDown.type === "genre"
                      ? `See the latest releases in ${drillDown.value.genre}. Click a bar to explore the artist!`
                      : drillDown.type === "artist"
                      ? `Breakdown of ${drillDown.value.artist}'s recent releases by type (singles vs. albums)`
                      : "The most common genres in new releases globally. Click a slice to dive in!"}
                  </p>
                  <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                      {drillDown.type === "genre" ? (
                        <BarChart
                          data={drillDown.value.releases}
                          onClick={handleReleaseDrillDown}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                          />
                          <XAxis
                            dataKey="name"
                            stroke="#9CA3AF"
                            label={{
                              value: "Release Title",
                              position: "insideBottom",
                              offset: -5,
                            }}
                          />
                          <YAxis
                            stroke="#9CA3AF"
                            label={{
                              value: "Tracks",
                              angle: -90,
                              position: "insideLeft",
                            }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(31, 41, 55, 0.8)",
                              borderColor: "#4B5563",
                            }}
                          />
                          <Bar
                            dataKey="total_tracks"
                            fill="#1DB954"
                            name="Number of Tracks"
                          />
                        </BarChart>
                      ) : drillDown.type === "artist" ? (
                        <PieChart>
                          <Pie
                            data={drillDown.value.typeBreakdown}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {drillDown.value.typeBreakdown.map(
                              (entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              )
                            )}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(31, 41, 55, 0.8)",
                              borderColor: "#4B5563",
                            }}
                          />
                        </PieChart>
                      ) : (
                        <PieChart>
                          <Pie
                            data={insights.genreDominance}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, value }) => `${name} (${value})`}
                            onClick={handleGenreDrillDown}
                          >
                            {insights.genreDominance.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, name) => [
                              `${value} releases`,
                              name,
                            ]}
                            contentStyle={{
                              backgroundColor: "rgba(31, 41, 55, 0.8)",
                              borderColor: "#4B5563",
                            }}
                          />
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                  {drillDown.type === "artist" && (
                    <div className="mt-4 text-gray-300">
                      <p>
                        <strong>Total Releases:</strong>{" "}
                        {drillDown.value.releases.length} new releases by this
                        artist
                      </p>
                      <p>
                        <strong>Main Genres:</strong>{" "}
                        {drillDown.value.genres.join(", ") || "Not specified"}
                      </p>
                      <p>
                        <strong>Latest Release:</strong>{" "}
                        {drillDown.value.releases[0]?.name} (Released:{" "}
                        {formatReleaseDate(
                          drillDown.value.releases[0]?.release_date,
                          drillDown.value.releases[0]?.release_date_precision
                        )}
                        )
                      </p>
                    </div>
                  )}
                </motion.div>

                <motion.div
                  className="glass-card p-6 " 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-white">
                      {drillDown.type === "artist"
                        ? `${drillDown.value.artist}'s Recent Releases`
                        : "Release Activity Over Time"}
                    </h3>
                    {drillDown.type === "artist" && (
                      <button
                        onClick={resetDrillDown}
                        className="text-green-500 hover:text-green-400"
                      >
                        Back to Main View
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-4">
                    {drillDown.type === "artist"
                      ? `All recent releases by ${drillDown.value.artist}, sorted by date`
                      : "How many new releases happened globally recently vs. earlier. Hover for exact counts!"}
                  </p>
                  <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                      {drillDown.type === "artist" ? (
                        <BarChart data={drillDown.value.releases}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                          />
                          <XAxis
                            dataKey="name"
                            stroke="#9CA3AF"
                            label={{
                              value: "Release Title",
                              position: "insideBottom",
                              offset: -5,
                            }}
                          />
                          <YAxis
                            stroke="#9CA3AF"
                            label={{
                              value: "Tracks",
                              angle: -90,
                              position: "insideLeft",
                            }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(31, 41, 55, 0.8)",
                              borderColor: "#4B5563",
                            }}
                          />
                          <Bar
                            dataKey="total_tracks"
                            fill="#1DB954"
                            name="Number of Tracks"
                          />
                        </BarChart>
                      ) : (
                        <BarChart data={insights.releaseTrends}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                          />
                          <XAxis
                            dataKey="name"
                            stroke="#9CA3AF"
                            label={{
                              value: "Time Period",
                              position: "insideBottom",
                              offset: -5,
                            }}
                          />
                          <YAxis
                            stroke="#9CA3AF"
                            label={{
                              value: "Releases",
                              angle: -90,
                              position: "insideLeft",
                            }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(31, 41, 55, 0.8)",
                              borderColor: "#4B5563",
                            }}
                          />
                          <Bar
                            dataKey="value"
                            fill="#1DB954"
                            name="Number of Releases"
                          />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                
                <motion.div
                  className="glass-card p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-white">
                      Singles vs. Albums Globally
                    </h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">
                    See the split between new singles and albums worldwide.
                    Hover to see the numbers!
                  </p>
                  <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={insights.releaseTypes}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {insights.releaseTypes.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [
                            `${value} releases`,
                            name,
                          ]}
                          contentStyle={{
                            backgroundColor: "rgba(31, 41, 55, 0.8)",
                            borderColor: "#4B5563",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default OverviewPage;
