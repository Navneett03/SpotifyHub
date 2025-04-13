import { useContext } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import { AuthContext, AuthProvider } from "./contexts/AuthContext";
import { ChatbotProvider } from "./contexts/ChatbotContext";
import Sidebar from "./components/common/Sidebar";
import OverviewPage from "./pages/OverviewPage";
import TrendingTracksPage from "./pages/TrendingTracksPage";
import GenreInsightsPage from "./pages/GenreInsightsPage";
import ArtistRankingsPage from "./pages/ArtistRankingsPage";
import MyListeningPage from "./pages/MyListeningPage";
import SendNewslettersPage from "./pages/SendNewslettersPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import LoginPage from "./pages/LoginPage";
import Chatbot from "./components/Chatbot";
import PlaylistGenerator from "./pages/PlaylistGenerator";

const ProtectedRoute = ({ children }) => {
  const { token, isLoading } = useContext(AuthContext);
  if (isLoading) return null;
  console.log("ProtectedRoute - Current URL:", window.location.href);
  console.log("ProtectedRoute - Token:", token);
  if (!token) {
    console.log("ProtectedRoute - No token, redirecting to /login");
    return <Navigate to="/login" replace />;
  }
  console.log("ProtectedRoute - Token present, rendering protected route");
  return children;
};

function App() {
  return (
    <AuthProvider>
      <ChatbotProvider>
        <div className="flex min-h-screen bg-black text-white">
          {/* Background Layers */}
          <div className="fixed inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-90" />
            <div className="absolute inset-0 backdrop-blur-sm" />
          </div>

          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <div className="flex flex-1 min-h-screen">
                    <Sidebar />
                    <main className="flex-1 relative z-10 overflow-y-auto h-screen">
                      <Routes>
                        <Route path="/" element={<OverviewPage />} />
                        <Route
                          path="/trending-tracks"
                          element={<TrendingTracksPage />}
                        />
                        <Route
                          path="/genre-insights"
                          element={<GenreInsightsPage />}
                        />
                        <Route
                          path="/artist-rankings"
                          element={<ArtistRankingsPage />}
                        />
                        <Route
                          path="/my-listening"
                          element={<MyListeningPage />}
                        />
                        <Route
                          path="/send-newsletters"
                          element={<SendNewslettersPage />}
                        />
                        <Route
                          path="/recommendations"
                          element={<RecommendationsPage />}
                        />
                        <Route
                          path="/playlist-generator"
                          element={<PlaylistGenerator />}
                        />
                      </Routes>
                    </main>
                    <Chatbot /> {/* Moved inside ProtectedRoute */}
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </ChatbotProvider>
    </AuthProvider>
  );
}

export default App;
