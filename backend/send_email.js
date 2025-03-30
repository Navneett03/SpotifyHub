const nodemailer = require("nodemailer");
const fetchData = require("./fetch_data");
const { execSync } = require("child_process");

async function sendEmail(userId, weekStart, weekEnd) {
  const userData = await fetchData(userId, weekStart, weekEnd);

  if (!userData) return;

  // Generate charts using Python
  execSync(
    `python3 generate_charts.py '${userData.listeningTrends}' '${userData.genreDistribution}'`
  );


  const topTrack =
    userData.topTracks.length > 0 ? userData.topTracks[0] : "No Data";

  const topArtist = Object.keys(userData.artistPopularity).reduce(
    (a, b) =>
      userData.artistPopularity[a] > userData.artistPopularity[b] ? a : b,
    "No Data"
  );
  const totalListeningTime = Object.values(JSON.parse(userData.listeningTrends)).reduce(
    (a, b) => a + b,
    0
  );
  const totalHours = (totalListeningTime / 60).toFixed(2);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "spotifyhubinsights@gmail.com",
      pass: "odih rydg sbyz vlpp",
    },
  });

  const emailHtml = `
<html>
<head>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background-color: #f4f4f4; 
            margin: 0; 
            padding: 0; 
        }
        .container { 
            width: 90%; 
            max-width: 600px; 
            margin: 20px auto; 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); 
        }
        .header { 
            background: #1DB954; 
            color: white; 
            text-align: center; 
            padding: 15px; 
            font-size: 20px; 
            font-weight: bold; 
            border-radius: 8px 8px 0 0;
        }
        .section { 
            margin: 20px 0; 
        }
        h2 { 
            color: #1DB954; 
            font-size: 18px; 
            border-bottom: 2px solid #1DB954; 
            padding-bottom: 5px; 
        }
        p { 
            font-size: 14px; 
            color: #333; 
            line-height: 1.5; 
        }
        .insight-link, .cta a { 
            display: inline-block; 
            background: #1DB954; 
            color: white; 
            padding: 10px 15px; 
            text-decoration: none; 
            border-radius: 5px; 
            font-weight: bold;
            margin-top: 10px;
        }
        .insight-link:hover, .cta a:hover { 
            background: #17a34a; 
        }
        .chart-container {
            text-align: center;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">🎧 Your Weekly Spotify Insights</div>

        <!-- Key Metrics Section -->
        <div class="section">
            <h2>📊 Key Metrics</h2>
            <p><strong>Top Track:</strong> ${topTrack}</p>
            <p><strong>Top Artist:</strong> ${topArtist}</p>
            <p><strong>Total Listening Time:</strong> ${totalHours} hours</p>
        </div>

        <!-- Listening Trends Section -->
        <div class="section">
            <h2>📈 Listening Trends</h2>
            <div class="chart-container">
                <img src="cid:listening_trends" alt="Listening Trends Chart" width="100%">
            </div>
        </div>

        <!-- Genre Distribution Section -->
        <div class="section">
            <h2>🎼 Genre Distribution</h2>
            <div class="chart-container">
                <img src="cid:genre_distribution" alt="Genre Distribution Chart" width="100%">
            </div>
        </div>

        <!-- Actionable Insights Section -->
        <div class="section">
            <h2>🎯 Actionable Insights</h2>
            <p>Get recommendations based on your mood and genre preferences.</p>
            <a href="http://localhost:5174/recommendations" class="insight-link">Get Your Recommendations</a>
        </div>

        <!-- Call to Action Section -->
        <div class="section cta">
            <h2>🔗 Explore More</h2>
            <p>Discover more detailed insights and explore your music trends.</p>
            <a href="http://localhost:5174/my-listening">Visit Your Dashboard</a>
        </div>
    </div>
</body>
</html>

    `;

  const mailOptions = {
    from: "spotifyhubinsights@gmail.com",
    to: userData.userEmail,
    subject: "Your Weekly Spotify Insights!",
    html: emailHtml,
    attachments: [
      {
        filename: "listening_trends.png",
        path: "listening_trends.png",
        cid: "listening_trends",
      },
      {
        filename: "genre_distribution.png",
        path: "genre_distribution.png",
        cid: "genre_distribution",
      },
    ],
  };

  await transporter.sendMail(mailOptions);
  console.log("Email sent successfully!");
}

// Run
sendEmail(1, "2025-03-24", "2025-03-30");
