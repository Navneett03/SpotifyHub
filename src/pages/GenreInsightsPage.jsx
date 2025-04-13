
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
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  AreaChart,
  Area,
} from "recharts";

const COLORS = ["#22c55e", "#ef4444", "#06b6d4", "#8b5cf6", "#f59e0b"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 bg-opacity-100 p-3 rounded-lg border border-gray-700">
        <p className="text-white font-semibold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value.toFixed(1)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const GenreInsightsPage = () => {
  const { token } = useContext(AuthContext);
  const [state, setState] = useState({
    genreData: [],
    artistByGenre: {},
    evolutionDataWeekly: [],
    evolutionDataMonthly: [],
    consistencyData: [],
    dayOfWeekData: [],
    monthDayData: {},
    weekDayData: {},
    weeklyData: {},
    monthlyData: {},
    timeframe: "",
    evolutionViewMode: "weekly",
    selectedSection: null,
    selectedGenre: null,
    drillDownView: "all",
    loading: true,
    error: null,
  });

  const fetchGenreData = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const today = new Date();
      const decemberCutoff = new Date("2024-12-01");

      // Fetch Top Artists
      const topArtistsRes = await axios.get(
        "https://api.spotify.com/v1/me/top/artists",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 20, time_range: "medium_term" },
        }
      );
      const topArtists = topArtistsRes.data?.items || [];

      // Fetch Recently Played
      const recentRes = await axios.get(
        "https://api.spotify.com/v1/me/player/recently-played",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 50 },
        }
      );
      const recentTracks =
        recentRes.data?.items.filter((track) => {
          const playedAt = new Date(track.played_at);
          return playedAt >= decemberCutoff && playedAt <= today;
        }) || [];

      if (!topArtists.length || !recentTracks.length) {
        throw new Error(
          "No music data found since December 2024. Play some tunes!"
        );
      }

      // Fetch Artist Genres
             const artistIds = [...new Set(recentTracks.flatMap((t) => t.track.artists.map((a) => a.id)))];

            // const artistRes = await axios.get("https://api.spotify.com/v1/artists", {
            //   headers: { Authorization: `Bearer ${token}` },
            //   params: { ids: artistIds.join(",") },
            // });
            // const artistDetails = artistRes.data.artists.reduce((acc, artist) => {
            //   acc[artist.id] = artist.genres?.[0] || "Others";
            //   return acc;
            // }, {});
            const fetchArtistGenres = async (ids) => {
              const chunkSize = 50;
              const allArtistData = {};

              for (let i = 0; i < ids.length; i += chunkSize) {
                const chunk = ids.slice(i, i + chunkSize);
                const res = await axios.get("https://api.spotify.com/v1/artists", {
                  headers: { Authorization: `Bearer ${token}` },
                  params: { ids: chunk.join(",") },
                });
                res.data.artists.forEach((artist) => {
                  allArtistData[artist.id] = artist.genres?.[0] || "Others";
                });
              }

              return allArtistData;
            };

      const artistDetails = await fetchArtistGenres(artistIds);

      // Section 1: Top Genres
      const genreCounts = {};
      const artistByGenre = {};
      topArtists.forEach((artist) => {
        const genre = artist.genres?.[0] || "Others";
        const pop = artist.popularity || 0;
        genreCounts[genre] = (genreCounts[genre] || 0) + pop;
        artistByGenre[genre] = artistByGenre[genre] || [];
        artistByGenre[genre].push({ name: artist.name, popularity: pop });
      });
      const genreData = Object.entries(genreCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
      const topGenres = genreData.map((g) => g.name);

      // Data Prep
      const weeklyData = {};
      const monthlyData = {};
      const dayOfWeekDataRaw = {
        Mon: {},
        Tue: {},
        Wed: {},
        Thu: {},
        Fri: {},
        Sat: {},
        Sun: {},
      };
      const weekDayData = {};
      const earliestTrack = recentTracks.length
        ? new Date(recentTracks[recentTracks.length - 1].played_at)
        : today;
      const timeframeStart = earliestTrack.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const timeframeEnd = today.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const timeframe = `${timeframeStart}-${timeframeEnd}, ${today.getFullYear()}`;

      recentTracks.forEach((track) => {
        const date = new Date(track.played_at);
        const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
          date.getDay()
        ];
        const weekStart = new Date(date);
        const dow = date.getDay();
        weekStart.setDate(date.getDate() - (dow === 0 ? 6 : dow - 1));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const weekEndDisplay = weekEnd > today ? new Date(today) : weekEnd;
        const weekKey = `${weekStart.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}-${weekEndDisplay.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}`;
        const monthKey = date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        track.track.artists.forEach((artist) => {
          const genre = artistDetails[artist.id];
          if (topGenres.includes(genre)) {
            weeklyData[weekKey] = weeklyData[weekKey] || {};
            weeklyData[weekKey][genre] = (weeklyData[weekKey][genre] || 0) + 1;
            monthlyData[monthKey] = monthlyData[monthKey] || {};
            monthlyData[monthKey][genre] =
              (monthlyData[monthKey][genre] || 0) + 1;
            dayOfWeekDataRaw[dayOfWeek][genre] =
              (dayOfWeekDataRaw[dayOfWeek][genre] || 0) + 1;
            // Aggregate plays by week for weekDayData
            weekDayData[weekKey] = weekDayData[weekKey] || {};
            weekDayData[weekKey][genre] =
              (weekDayData[weekKey][genre] || 0) + 1;
          }
        });
      });

      const evolutionDataWeekly = Object.entries(weeklyData)
        .map(([week, genres]) => {
          const entry = { week };
          topGenres.forEach((genre) => {
            entry[genre] = genres[genre] || 0;
          });
          return entry;
        })
        .filter(
          (entry) =>
            new Date(entry.week.split("-")[0] + `, ${today.getFullYear()}`) <=
            today
        )
        .sort(
          (a, b) =>
            new Date(a.week.split("-")[0] + `, ${today.getFullYear()}`) -
            new Date(b.week.split("-")[0] + `, ${today.getFullYear()}`)
        );

      const evolutionDataMonthly = Object.entries(monthlyData)
        .map(([month, genres]) => {
          const entry = { month };
          topGenres.forEach((genre) => {
            entry[genre] = genres[genre] || 0;
          });
          return entry;
        })
        .filter(
          (entry) => new Date(`1 ${entry.month}`).getTime() <= today.getTime()
        )
        .sort(
          (a, b) =>
            new Date(`1 ${a.month}`).getTime() -
            new Date(`1 ${b.month}`).getTime()
        );

      // Section 3: Consistency Data
      const recentGenreCounts = {};
      recentTracks.forEach((track) => {
        track.track.artists.forEach((artist) => {
          const genre = artistDetails[artist.id];
          recentGenreCounts[genre] = (recentGenreCounts[genre] || 0) + 1;
        });
      });
      const consistencyData = topGenres.map((genre) => ({
        name: genre,
        stability:
          (recentGenreCounts[genre] > 0 ? 0.5 : 0) +
          (genreCounts[genre] > 0 ? 0.5 : 0),
      }));

      // Section 3: Day-of-Week Trends
      const dayOfWeekData = [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun",
      ].map((day) => {
        const entry = { day };
        topGenres.forEach((genre) => {
          entry[genre] = dayOfWeekDataRaw[day][genre] || 0;
        });
        return entry;
      });

      setState({
        genreData,
        artistByGenre,
        evolutionDataWeekly,
        evolutionDataMonthly,
        consistencyData,
        dayOfWeekData,
        monthDayData: {},
        weekDayData,
        weeklyData,
        monthlyData,
        timeframe,
        evolutionViewMode: "weekly",
        selectedSection: null,
        selectedGenre: null,
        drillDownView: "all",
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error(
        "API Error Details:",
        error.response?.data || error.message
      );
      setState((prev) => ({
        ...prev,
        loading: false,
        error: `Oops! We couldn’t load your music stats: ${
          error.response?.data?.error?.message || error.message
        }`,
      }));
    }
  };

  useEffect(() => {
    if (token) fetchGenreData();
  }, [token]);

  const handleSectionClick = (section) => {
    setState((prev) => ({
      ...prev,
      selectedSection: prev.selectedSection === section ? null : section,
      selectedGenre: null,
    }));
    document.getElementById(section)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleEvolutionViewMode = (mode) => {
    setState((prev) => ({ ...prev, evolutionViewMode: mode }));
  };

  const handleGenreClick = (genre, section) => {
    setState((prev) => ({
      ...prev,
      selectedGenre:
        prev.selectedGenre === genre && prev.selectedSection === section
          ? null
          : genre,
      selectedSection: section,
    }));
  };

  const handleDrillDownView = (view) => {
    setState((prev) => ({ ...prev, drillDownView: view }));
  };

  const getDayOfWeekData = (genre) => {
    const { dayOfWeekData, weekDayData, drillDownView } = state;
    if (drillDownView === "weekly") {
      return Object.entries(weekDayData)
        .map(([key, genres]) => ({
          time: key, // key is the week range, e.g., "Mar 31-Apr 6"
          plays: genres[genre] || 0,
        }))
        .sort(
          (a, b) =>
            new Date(a.time.split("-")[0] + `, ${new Date().getFullYear()}`) -
            new Date(b.time.split("-")[0] + `, ${new Date().getFullYear()}`)
        );
    }
    return dayOfWeekData.map((d) => ({ time: d.day, plays: d[genre] || 0 }));
  };

  const {
    genreData,
    artistByGenre,
    evolutionDataWeekly,
    evolutionDataMonthly,
    consistencyData,
    dayOfWeekData,
    selectedSection,
    selectedGenre,
    drillDownView,
    evolutionViewMode,
    timeframe,
    loading,
    error,
  } = state;

  return (
    <div className="flex-1 overflow-auto text-white">
      <Header title="Your Music Vibes" />
      <nav className="sticky top-0 bg-gray-900 p-4 shadow-md z-10">
        <ul className="flex space-x-6 justify-center">
          <li>
            <button
              onClick={() => handleSectionClick("overview")}
              className="text-gray-300 hover:text-white font-semibold"
            >
              Your Top Genres
            </button>
          </li>
          <li>
            <button
              onClick={() => handleSectionClick("evolution")}
              className="text-gray-300 hover:text-white font-semibold"
            >
              Your Music Trends
            </button>
          </li>
          <li>
            <button
              onClick={() => handleSectionClick("insights")}
              className="text-gray-300 hover:text-white font-semibold"
            >
              Fun Listening Habits
            </button>
          </li>
        </ul>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4">
        {loading ? (
          <div className="text-center text-gray-400 py-10">
            Getting your music vibes ready...
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-10">{error}</div>
        ) : (
          <div className="space-y-12">
            {/* Section 1: Your Top Genres */}
            <section id="overview">
              <motion.div
                className="glass-card p-6 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-2xl font-bold mb-2">
                  Your Favorite Music Styles
                </h2>
                <p className="text-gray-400 text-sm mb-4">
                  The genres you’ve been loving lately.
                </p>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={genreData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                      onClick={(data) =>
                        handleGenreClick(data.name, "overview")
                      }
                    >
                      {genreData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                {selectedSection === "overview" && selectedGenre && (
                  <motion.div
                    className="glass-card p-6 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <h3 className="text-lg font-semibold">
                      {selectedGenre} Artists
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={artistByGenre[selectedGenre].sort(
                          (a, b) => b.popularity - a.popularity
                        )}
                        margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                        <XAxis
                          dataKey="name"
                          stroke="#9CA3AF"
                          angle={-15}
                          textAnchor="end"
                          height={70}
                          interval="preserveStartEnd"
                          tick={{ dx: 40 }}
                          label={{
                            value: "Artists",
                            position: "insideBottom",
                            offset: -20,
                          }}
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          label={{
                            value: "Popularity",
                            angle: -90,
                            position: "insideLeft",
                          }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="popularity" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}
              </motion.div>
            </section>

            {/* Section 2: Your Music Trends */}
            <section id="evolution">
              <motion.div
                className="glass-card p-6 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-2xl font-bold mb-2">Your Music Trends</h2>
                <p className="text-gray-400 text-sm mb-4">
                  Check out how your music taste changes over weeks or months
                  since {timeframe}.
                </p>
                <div className="flex space-x-4 mb-4">
                  <button
                    onClick={() => handleEvolutionViewMode("weekly")}
                    className={`px-2 py-1 rounded ${
                      evolutionViewMode === "weekly"
                        ? "bg-blue-500"
                        : "bg-gray-600"
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => handleEvolutionViewMode("monthly")}
                    className={`px-2 py-1 rounded ${
                      evolutionViewMode === "monthly"
                        ? "bg-blue-500"
                        : "bg-gray-600"
                    }`}
                  >
                    Monthly
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  {evolutionViewMode === "weekly" ? (
                    <LineChart data={evolutionDataWeekly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                      <XAxis
                        dataKey="week"
                        stroke="#9CA3AF"
                        label={{
                          value: "Week",
                          position: "insideBottom",
                          offset: -5,
                        }}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        label={{
                          value: "Songs Played",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      {genreData.map((genre, index) => (
                        <Line
                          key={genre.name}
                          type="monotone"
                          dataKey={genre.name}
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                          onClick={() =>
                            handleGenreClick(genre.name, "evolution")
                          }
                        />
                      ))}
                    </LineChart>
                  ) : (
                    <BarChart data={evolutionDataMonthly}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                      <XAxis
                        dataKey="month"
                        stroke="#9CA3AF"
                        label={{
                          value: "Month",
                          position: "insideBottom",
                          offset: -5,
                        }}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        label={{
                          value: "Songs Played",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      {genreData.map((genre, index) => (
                        <Bar
                          key={genre.name}
                          dataKey={genre.name}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </motion.div>
            </section>

            {/* Section 3: Fun Listening Habits */}
            <section id="insights">
              <motion.div
                className="glass-card p-6 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-2xl font-bold mb-4">
                  Your Listening Habits
                </h2>

                {/* Consistency Score */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">
                    How Loyal Are You to Your Genres?
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Shows if you stick to your favorite music styles.
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={consistencyData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" stroke="#9CA3AF" />
                      <Radar
                        name="Loyalty"
                        dataKey="stability"
                        stroke="#22c55e"
                        fill="#22c55e"
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Day-of-Week Trends */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">
                    Your Weekday Music Mood
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Your daily music favorites across all days since {timeframe}
                    .
                  </p>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dayOfWeekData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                      <XAxis
                        dataKey="day"
                        stroke="#9CA3AF"
                        label={{
                          value: "Day of Week",
                          position: "insideBottom",
                          offset: -5,
                        }}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        label={{
                          value: "Songs Played",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      {genreData.map((genre, index) => (
                        <Area
                          key={genre.name}
                          type="monotone"
                          dataKey={genre.name}
                          stackId="1"
                          stroke={COLORS[index % COLORS.length]}
                          fill={COLORS[index % COLORS.length]}
                          onClick={() =>
                            handleGenreClick(genre.name, "day-of-week")
                          }
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                  {selectedSection === "day-of-week" && selectedGenre && (
                    <motion.div
                      className="glass-card p-6 mb-8"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <h3 className="text-lg font-semibold">
                        {selectedGenre} Daily Breakdown
                      </h3>
                      <div className="flex space-x-4 mb-4">
                        <button
                          onClick={() => handleDrillDownView("weekly")}
                          className={`px-2 py-1 rounded ${
                            drillDownView === "weekly"
                              ? "bg-blue-500"
                              : "bg-gray-600"
                          }`}
                        >
                          By Week
                        </button>
                        <button
                          onClick={() => handleDrillDownView("all")}
                          className={`px-2 py-1 rounded ${
                            drillDownView === "all"
                              ? "bg-blue-500"
                              : "bg-gray-600"
                          }`}
                        >
                          By Day
                        </button>
                      </div>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={getDayOfWeekData(selectedGenre)}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#4B5563"
                          />
                          <XAxis
                            dataKey="time"
                            stroke="#9CA3AF"
                            label={{
                              value:
                                drillDownView === "weekly"
                                  ? "Week"
                                  : "Day of Week",
                              position: "insideBottom",
                              offset: -5,
                            }}
                          />
                          <YAxis
                            stroke="#9CA3AF"
                            label={{
                              value: "Songs Played",
                              angle: -90,
                              position: "insideLeft",
                            }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="plays" fill="#ef4444" />
                        </BarChart>
                      </ResponsiveContainer>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default GenreInsightsPage;
