const mysql = require("mysql2/promise");

async function fetchData(userId, weekStart, weekEnd) {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Mansa300404",
    database: "spotify_insights",
  });

  // Fetch user details
  const [user] = await connection.execute(
    `SELECT name, email FROM users WHERE id = ?`,
    [userId]
  );

  if (user.length === 0) {
    console.log("User not found.");
    return null;
  }

  const userName = user[0].name;
  const userEmail = user[0].email;

  // Fetch weekly insights
  const [weeklyData] = await connection.execute(
    `SELECT * FROM weekly_music_insights WHERE user_id = ? AND week_start = ? AND week_end = ?`,
    [userId, weekStart, weekEnd]
  );

  if (weeklyData.length === 0) {
    console.log("No insights found for this week.");
    return null;
  }

  const insights = weeklyData[0];

// let topTracks;
// try {
//   topTracks = JSON.parse(insights.top_tracks);
// } catch (error) {
//   console.error("Error parsing topTracks:", error);
//   topTracks = [];
// }


  return {
    userName,
    userEmail,
    weekStart,
    weekEnd,
    topTracks: JSON.parse(insights.top_tracks),
    recentlyPlayed: insights.recently_played ? insights.recently_played : [],
    artistPopularity: insights.artist_popularity, 
    listeningTrends: JSON.stringify(insights.listening_trends), 
    genreDistribution: JSON.stringify(insights.genre_distribution), 
  };
}

module.exports = fetchData;
