import { createContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { exchangeCodeForToken, refreshToken } from "../utils/spotifyAuth";


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [refreshTokenValue, setRefreshTokenValue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const hasNavigated = useRef(false); // Prevent multiple navigations

  useEffect(() => {
    console.log("AuthContext useEffect running...");
    console.log("Current URL:", window.location.href);

    // Check if we've already navigated to avoid loops
    if (hasNavigated.current) {
      console.log("Already navigated, skipping useEffect...");
      return;
    }

    // Check for token in localStorage on mount
    const storedToken = localStorage.getItem("spotify_access_token");
    const tokenExpiry = localStorage.getItem("spotify_token_expiry");
    const storedRefreshToken = localStorage.getItem("spotify_refresh_token");

    if (storedToken && tokenExpiry && storedRefreshToken) {
      console.log("Found stored token:", storedToken);
      console.log("Token expiry:", tokenExpiry);
      console.log("Stored refresh token:", storedRefreshToken);
      if (Date.now() < parseInt(tokenExpiry)) {
        console.log("Token is still valid, setting token...");
        setToken(storedToken);
        setRefreshTokenValue(storedRefreshToken);
        setIsLoading(false);
        console.log("Navigating to / because token is valid...");
        hasNavigated.current = true;
        navigate("/", { replace: true });
        return;
      } else {
        console.log("Token expired, attempting to refresh...");
        refreshToken(storedRefreshToken)
          .then((data) => {
            console.log("Refresh token response:", data);
            const accessToken = data.access_token;
            const expiresIn = data.expires_in;
            setToken(accessToken);
            localStorage.setItem("spotify_access_token", accessToken);
            localStorage.setItem("spotify_token_expiry", Date.now() + expiresIn * 1000);
            setIsLoading(false);
            console.log("Token refreshed, navigating to /...");
            hasNavigated.current = true;
            navigate("/", { replace: true });
          })
          .catch((error) => {
            console.error("Error refreshing token:", error);
            localStorage.removeItem("spotify_access_token");
            localStorage.removeItem("spotify_token_expiry");
            localStorage.removeItem("spotify_refresh_token");
            setIsLoading(false);
            console.log("Redirecting to login due to refresh failure...");
            hasNavigated.current = true;
            navigate("/login", { replace: true });
          });
        return;
      }
    }

    // Parse code from URL query (Authorization Code Flow)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    console.log("URL query code:", code);

    if (code) {
      exchangeCodeForToken(code)
        .then((data) => {
          console.log("Token exchange response:", data);
          const accessToken = data.access_token;
          const expiresIn = data.expires_in;
          const refreshToken = data.refresh_token;

          if (accessToken) {
            console.log("Setting token...");
            setToken(accessToken);
            setRefreshTokenValue(refreshToken);
            localStorage.setItem("spotify_access_token", accessToken);
            localStorage.setItem("spotify_token_expiry", Date.now() + expiresIn * 1000);
            localStorage.setItem("spotify_refresh_token", refreshToken);
            window.history.replaceState({}, document.title, "/"); // Clear query params
            console.log("Token set, navigating to /...");
            hasNavigated.current = true;
            navigate("/", { replace: true });
            setIsLoading(false);
          } else {
            console.log("No access_token in response, redirecting to login...");
            hasNavigated.current = true;
            navigate("/login", { replace: true });
            setIsLoading(false);
          }
        })
        .catch((error) => {
          console.error("Error exchanging code for token:", error);
          hasNavigated.current = true;
          navigate("/login", { replace: true });
          setIsLoading(false);
        });
    } else {
      console.log("No code in URL, setting isLoading to false...");
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    console.log("Token state updated:", token);
    console.log("Refresh token state updated:", refreshTokenValue);
  }, [token, refreshTokenValue]);

  if (isLoading) {
    console.log("Rendering loading screen...");
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="glass-card p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Loading...</h2>
        </div>
      </div>
    );
  }

  console.log("Rendering children with token:", token);
  return (
    <AuthContext.Provider value={{ token, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};