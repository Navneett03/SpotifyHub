

const CLIENT_ID = "219374d3b5cd4f68a21ced4067070aec"; // Your Client ID
const REDIRECT_URI = "http://localhost:5174";
const SCOPES =
  "user-top-read user-read-recently-played playlist-read-private user-read-private user-library-read user-read-email";


export const loginWithSpotify = () => {
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}&show_dialog=true`;

  console.log("Redirecting to Spotify auth URL:", authUrl);
  window.location.href = authUrl;
};


export const exchangeCodeForToken = async (code) => {
  console.log("Exchanging code for token:", code);
  try {
    const response = await fetch("http://localhost:3002/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }), // 🟢 Include user_id
    });

    const data = await response.json();
    console.log("Token exchange response:", data);

    if (!response.ok) {
      throw new Error(data.error || "Failed to exchange code for token");
    }
    return data;
  } catch (error) {
    console.error("Error in exchangeCodeForToken:", error.message);
    throw error;
  }
};


export const refreshToken = async (refreshToken) => {
  console.log("Refreshing token with refreshToken:", refreshToken);
  try {
    const response = await fetch("http://localhost:3002/api/refresh-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await response.json();
    console.log("Refresh token response:", data);

    if (!response.ok) {
      throw new Error(data.error || "Failed to refresh token");
    }
    return data;
  } catch (error) {
    console.error("Error in refreshToken:", error.message);
    throw error;
  }
};