import { createContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  exchangeCodeForToken,
  refreshToken,
} from "../utils/spotifyAuth";


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [refreshTokenValue, setRefreshTokenValue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const hasNavigated = useRef(false);
  const hasUsedCode = useRef(false); // ✅ To prevent code reuse

  useEffect(() => {
    const storedToken = localStorage.getItem("spotify_access_token");
    const tokenExpiry = localStorage.getItem("spotify_token_expiry");
    const storedRefreshToken = localStorage.getItem("spotify_refresh_token");

    if (storedToken && tokenExpiry && storedRefreshToken) {
      if (Date.now() < parseInt(tokenExpiry)) {
        setToken(storedToken);
        setRefreshTokenValue(storedRefreshToken);
        setIsLoading(false);
        hasNavigated.current = true;
        if (!hasNavigated.current && window.location.pathname !== "/") {
          hasNavigated.current = true;
          navigate("/", { replace: true });
        }

        // navigate("/", { replace: true });
        return;
      } else {
        refreshToken(storedRefreshToken)
          .then((data) => {
            const accessToken = data.access_token;
            const expiresIn = data.expires_in;
            setToken(accessToken);
            localStorage.setItem("spotify_access_token", accessToken);
            localStorage.setItem(
              "spotify_token_expiry",
              Date.now() + expiresIn * 1000
            );
            setIsLoading(false);
            hasNavigated.current = true;
            if (!hasNavigated.current && window.location.pathname !== "/") {
              hasNavigated.current = true;
              navigate("/", { replace: true });
            }

            // navigate("/", { replace: true });
          })
          .catch((error) => {
            console.error("Error refreshing token:", error);
            localStorage.removeItem("spotify_access_token");
            localStorage.removeItem("spotify_refresh_token");
            localStorage.removeItem("spotify_token_expiry");

            setIsLoading(false);
            hasNavigated.current = true;
            navigate("/login", { replace: true });
          });
        return;
      }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code && !hasUsedCode.current) {
      hasUsedCode.current = true; // ✅ Mark code as used

      exchangeCodeForToken(code)
        .then((data) => {
          const accessToken = data.access_token;
          const expiresIn = data.expires_in;
          const refreshToken = data.refresh_token;
          const spotifyUserId = data.user_id;

          if (accessToken) {
            setToken(accessToken);
            setRefreshTokenValue(refreshToken);
            localStorage.setItem("spotify_access_token", accessToken);
            localStorage.setItem(
              "spotify_token_expiry",
              Date.now() + expiresIn * 1000
            );
            localStorage.setItem("spotify_refresh_token", refreshToken);

            if (spotifyUserId) {
              localStorage.setItem("spotify_user_id", spotifyUserId); // ✅ Save Spotify user_id
            }
            // ✅ Remove code from URL immediately
            window.history.replaceState({}, document.title, "/");
            hasNavigated.current = true;
            if (!hasNavigated.current && window.location.pathname !== "/") {
              hasNavigated.current = true;
              navigate("/", { replace: true });
            }

            // navigate("/", { replace: true });
          } else {
            navigate("/login", { replace: true });
          }
        })
        .catch((error) => {
          console.error("Error exchanging code for token:", error);
          navigate("/login", { replace: true });
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="glass-card p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ token, setToken, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
