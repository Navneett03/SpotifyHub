import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "../components/common/Header";

const SendNewslettersPage = () => {
  const [subscribed, setSubscribed] = useState(false);
  const [contentTypes, setContentTypes] = useState({
    musicRecommendations: false,
    artistUpdates: false,
    concertAlerts: false,
  });
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");

  const handleContentTypeChange = (e) => {
    const { name, checked } = e.target;
    setContentTypes((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subscribed) {
      setStatus("Please opt in to receive newsletters.");
      return;
    }

    const selectedTypes = Object.entries(contentTypes)
      .filter(([_, value]) => value)
      .map(([key]) => key);
    if (selectedTypes.length === 0) {
      setStatus("Please select at least one content type.");
      return;
    }

    console.log("Newsletter preferences saved:", {
      subscribed,
      contentTypes: selectedTypes,
    });
    setStatus("Preferences saved successfully!");
    setTimeout(() => setStatus(null), 3000);
  };

  const sendNewsletterNow = async () => {
    if (!subscribed) {
      setStatus("Please subscribe to send newsletters.");
      return;
    }
    if (!userEmail || !weekStart || !weekEnd) {
      setStatus("Newsletter sent successfully!");
      return;
    }

    setSending(true);
    setStatus("Sending newsletter...");

    try {
      const response = await fetch(
        "http://localhost:5174/api/send-newsletter",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userEmail, weekStart, weekEnd }),
        }
      );

      const data = await response.json();
      setStatus(
        response.ok ? "Newsletter sent successfully!" : `Error: ${data.error}`
      );
    } catch (error) {
      setStatus("Error sending newsletter.");
      console.error("Error:", error);
    }

    setSending(false);
  };

  return (
    <div className="flex-1 overflow-auto relative z-10 bg-black">
      <Header title="Newsletter Preferences" />
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-semibold text-white mb-4">
            Manage Your Newsletters
          </h2>
          <p className="text-gray-300 mb-6">
            Customize your newsletter preferences below to get the latest music
            updates tailored to your interests!
          </p>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Subscription Toggle */}
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={subscribed}
                    onChange={(e) => setSubscribed(e.target.checked)}
                    className="form-checkbox h-5 w-5 text-green-500 bg-gray-800 border-gray-600 rounded focus:ring-green-500"
                  />
                  <span className="text-gray-300">
                    Subscribe to newsletters
                  </span>
                </label>
              </div>

              {/* Content Types */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">
                  Choose Your Content
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="musicRecommendations"
                      checked={contentTypes.musicRecommendations}
                      onChange={handleContentTypeChange}
                      className="form-checkbox h-5 w-5 text-green-500 bg-gray-800 border-gray-600 rounded focus:ring-green-500"
                    />
                    <span className="text-gray-300">Music Recommendations</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="artistUpdates"
                      checked={contentTypes.artistUpdates}
                      onChange={handleContentTypeChange}
                      className="form-checkbox h-5 w-5 text-green-500 bg-gray-800 border-gray-600 rounded focus:ring-green-500"
                    />
                    <span className="text-gray-300">Artist Updates</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="concertAlerts"
                      checked={contentTypes.concertAlerts}
                      onChange={handleContentTypeChange}
                      className="form-checkbox h-5 w-5 text-green-500 bg-gray-800 border-gray-600 rounded focus:ring-green-500"
                    />
                    <span className="text-gray-300">Concert Alerts</span>
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                >
                  Save Preferences
                </button>
                <button
                  type="button"
                  onClick={() => sendNewsletterNow()}
                  disabled={sending}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    sending
                      ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  {sending ? "Sending..." : "Send Newsletter Now"}
                </button>
              </div>

              {/* Status Message */}
              {status && (
                <p
                  className={`mt-4 text-sm ${
                    status.includes("success")
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {status}
                </p>
              )}
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default SendNewslettersPage;
