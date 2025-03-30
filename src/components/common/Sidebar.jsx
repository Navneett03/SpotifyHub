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
  Calendar,
  Menu,
  MessageCircle,
  Search,
} from "lucide-react";

const SIDEBAR_ITEMS = [
  {
    name: "Overview",
    icon: BarChart2,
    color: "#1DB954",
    href: "/",
  },
  {
    name: "Trending Tracks",
    icon: Music,
    color: "#1DB954",
    href: "/trending-tracks",
  },
  {
    name: "Genre Insights",
    icon: Globe,
    color: "#1DB954",
    href: "/genre-insights",
  },
  {
    name: "Artist Rankings",
    icon: Star,
    color: "#1DB954",
    href: "/artist-rankings",
  },
  {
    name: "My Listening",
    icon: Headphones,
    color: "#1DB954",
    href: "/my-listening",
  },
  {
    name: "Send Newsletters",
    icon: Mail,
    color: "#1DB954",
    href: "/send-newsletters",
  },
  {
    name: "Recommendations",
    icon: Search,
    color: "#1DB954",
    href: "/recommendations",
  },
  {
    name: "Chatbot", // New Chatbot Link
    icon: MessageCircle,
    color: "#1DB954",
    href: "/chatbot",
  },

];

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <motion.div
      className="relative z-20 transition-all duration-300 ease-in-out flex-shrink-0 glass-card h-full"
      animate={{ width: isSidebarOpen ? 256 : 80 }}
    >
      <div className="h-full p-4 flex flex-col">
        {/* Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="glass-button p-2 mb-6 max-w-fit"
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
                <item.icon size={20} className="text-spotify-green min-w-[20px]" />
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
        </nav>
      </div>
    </motion.div>
  );
};

export default Sidebar;