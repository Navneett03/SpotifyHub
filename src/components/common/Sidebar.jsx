import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BarChart2,
  Music,
  Globe,
  Star,
  Headphones,
  Mail,
  Menu,
  MessageCircle,
  Search,
  PlayIcon,
} from "lucide-react";
import { useChatbot } from "../../contexts/ChatbotContext";

const SIDEBAR_ITEMS = [
  { name: "Overview", icon: BarChart2, color: "#1DB954", href: "/" },
  {
    name: "Trending Tracks",
    icon: Music,
    color: "#1DB954",
    href: "/trending-tracks",
  },
  {
    name: "Artist Rankings",
    icon: Star,
    color: "#1DB954",
    href: "/artist-rankings",
  },
  {
    name: "Genre Insights",
    icon: Globe,
    color: "#1DB954",
    href: "/genre-insights",
  },
  {
    name: "My Listening",
    icon: Headphones,
    color: "#1DB954",
    href: "/my-listening",
  },
  {
    name: "Recommendations",
    icon: Search,
    color: "#1DB954",
    href: "/recommendations",
  },
  {
    name: "Playlist Generator",
    icon: PlayIcon,
    color: "#1DB954",
    href: "/playlist-generator",
  },
  // Removed "Send Newsletters" item
];

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { setIsOpen } = useChatbot();

  const handleSendNewsletter = async () => {
    console.log("Sending request to /send-newsletter-immediately");
    try {
      const response = await fetch(
        "http://localhost:3002/send-newsletter-immediately",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Response status:", response.status);
      if (response.ok) {
        alert("Newsletters sent successfully!");
      } else {
        const errorData = await response.json();
        console.error("Error data:", errorData);
        alert(
          `Failed to send newsletters: ${errorData.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error sending newsletters:", error);
      alert("Error sending newsletters.");
    }
  };

  return (
    <motion.div
      className="relative z-20 transition-all duration-300 ease-in-out flex-shrink-0 glass-card h-full"
      animate={{ width: isSidebarOpen ? 256 : 80 }}
    >
      <div className="h-full p-4 flex flex-col">
        {/* Logo Section */}
        <div className="mb-6 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.h1
                key="full-logo"
                className="text-2xl font-bold text-spotify-green"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                SpotifyHub
              </motion.h1>
            ) : (
              <motion.h1
                key="short-logo"
                className="text-2xl font-bold text-spotify-green"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                SH
              </motion.h1>
            )}
          </AnimatePresence>
        </div>

        {/* Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="glass-button p-2 mb-6 max-w-fit self-start"
        >
          <Menu size={24} className="text-spotify-green" />
        </motion.button>

        {/* Navigation */}
        <nav className="flex-grow">
          {SIDEBAR_ITEMS.map((item) => (
            <Link key={item.href} to={item.href}>
              <motion.div
                className="flex items-center p-3 text-sm font-medium rounded-lg hover:bg-gray-800 hover:bg-opacity-70 transition-colors mb-2"
                whileHover={{ x: 5 }}
              >
                <item.icon
                  size={20}
                  className="text-spotify-green min-w-[20px]"
                />
                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.span
                      className="ml-4 whitespace-nowrap text-gray-200"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2, delay: 0.1 }}
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          ))}
          {/* Chatbot Item */}
          <motion.div
            className="flex items-center p-3 text-sm font-medium rounded-lg hover:bg-gray-800 hover:bg-opacity-70 transition-colors mb-2"
            whileHover={{ x: 5 }}
          >
            <MessageCircle
              size={20}
              className="text-spotify-green min-w-[20px]"
            />
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.button
                  onClick={() => setIsOpen(true)}
                  className="ml-4 whitespace-nowrap text-gray-200 bg-transparent border-none p-0 cursor-pointer"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                >
                  Chatbot
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </nav>

        {/* Send Newsletter Now Button at Bottom */}
        <motion.div
          className="mt-auto" // Pushes the button to the bottom
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <button
            onClick={handleSendNewsletter}
            className="flex items-center justify-center w-full p-3 text-sm font-medium text-white bg-spotify-green rounded-lg hover:bg-opacity-90 transition-colors"
          >
            <Mail size={20} className="min-w-[20px]" />
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.span
                  className="ml-2 whitespace-nowrap"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                >
                  Send Newsletter Now
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
