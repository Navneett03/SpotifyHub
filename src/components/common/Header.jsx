import PropTypes from "prop-types";

const Header = ({ title = "Default Title" }) => {
  // Ensure title is always a string to prevent splitting undefined
  const safeTitle = title || "Newsletter Signup";

  return (
    <header className="glass-header">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">
          <span className="text-spotify-green">{safeTitle.split(" ")[0]}</span>{" "}
          {safeTitle.split(" ").slice(1).join(" ")}
        </h1>
      </div>
    </header>
  );
};

Header.propTypes = {
  title: PropTypes.string, // Removed .isRequired since we have a default
};

export default Header;
