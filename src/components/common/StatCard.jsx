import { motion } from "framer-motion";
import PropTypes from "prop-types";

const StatCard = ({ name, icon: Icon, value, color = "#1DB954", definition = "" }) => {
  return (
    <motion.div
      className="glass-card overflow-hidden"
      whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="flex items-center text-sm font-medium text-gray-400">
              <Icon size={20} className="mr-2 text-spotify-green" style={{ color }} />
              {name}
            </span>
            <p className="mt-1 text-3xl font-semibold text-white">{value}</p>
            {definition && (
              <p className="mt-2 text-xs text-gray-500 italic">{definition}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

StatCard.propTypes = {
  name: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  value: PropTypes.string.isRequired,
  color: PropTypes.string,
  definition: PropTypes.string,
};

export default StatCard;