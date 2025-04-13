import { motion } from "framer-motion";
import { loginWithSpotify } from "../utils/spotifyAuth";

const LoginPage = () => {
  return (
    <div className="pl-[475px] flex items-center justify-center h-screen bg-black">
      <motion.div
        className="glass-card p-8 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-semibold text-white mb-4">Welcome to Spotify Dashboard</h1>
        <p className="text-gray-300 mb-6">Log in with Spotify to explore your music insights.</p>
        <button
          onClick={loginWithSpotify}
          className="glass-button bg-spotify-green bg-opacity-80 hover:bg-opacity-100 transition-all"
        >
          Log In with Spotify
        </button>
      </motion.div>
    </div>
  );
};

export default LoginPage;