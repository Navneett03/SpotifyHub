import { useState } from "react";
import { useChatbot } from "../contexts/ChatbotContext";

const Chatbot = () => {
  const [userInput, setUserInput] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const { isOpen, setIsOpen } = useChatbot();

  const handleChat = async () => {
    const question = userInput.trim();
    if (!question) return;

    setLoading(true);
    setChatResponse("");

    try {
      const response = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setChatResponse(data.response);
    } catch (error) {
      console.error("Chatbot Error:", error);
      setChatResponse("⚠️ Error fetching response. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 focus:outline-none z-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 10h8M8 14h4m-8 6h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 w-80 bg-gray-900 text-white rounded-lg shadow-lg p-4 z-50">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold">Spotify Chatbot</h1>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white focus:outline-none"
            >
              ✕
            </button>
          </div>

          <textarea
            className="w-full p-2 bg-gray-700 rounded-md text-white resize-none"
            rows="3"
            placeholder="Ask me about your Spotify insights..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
          />

          <button
            onClick={handleChat}
            className="mt-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            disabled={loading}
          >
            {loading ? "Thinking..." : "Ask Chatbot"}
          </button>

          {chatResponse && (
            <div className="mt-4 p-4 bg-gray-700 rounded-md max-h-40 overflow-y-auto">
              <strong className="text-green-400">Bot:</strong> {chatResponse}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Chatbot;
