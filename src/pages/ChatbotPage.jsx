import { useState } from "react";

const Chatbot = () => {
  const [userInput, setUserInput] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChat = async () => {
    const question = userInput.trim();
    if (!question) return;

    setLoading(true);
    setChatResponse(""); // Clear previous response

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Spotify Chatbot</h1>

      <div className="w-full max-w-md p-4 bg-gray-800 rounded-lg shadow-lg">
        <textarea
          className="w-full p-2 bg-gray-700 rounded-md text-white"
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
      </div>

      <div className="mt-4 w-full max-w-md">
        {chatResponse && (
          <div className="p-4 bg-gray-700 rounded-md">
            <strong className="text-green-400">Bot:</strong> {chatResponse}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chatbot;
