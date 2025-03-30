from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from langchain.docstore.document import Document
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser

# Initialize Flask App
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Set API Keys & Environment Variables
os.environ["GOOGLE_API_KEY"] = "AIzaSyDUKe0P5kaqHNG3l0cHDUcfkdDAVuCMcu4"

SPOTIFY_CLIENT_ID = "f184137f28424c3990fae6e734285148"
SPOTIFY_CLIENT_SECRET = "4e5453622c2b4843988d399adbab5535"
SPOTIFY_REDIRECT_URI = "http://localhost:8888/callback"
SCOPES = "user-library-read user-top-read user-read-recently-played user-follow-read playlist-read-private playlist-read-collaborative user-read-playback-state user-read-currently-playing"

# Spotify Authentication
sp = spotipy.Spotify(
    auth_manager=SpotifyOAuth(
        client_id=SPOTIFY_CLIENT_ID,
        client_secret=SPOTIFY_CLIENT_SECRET,
        redirect_uri=SPOTIFY_REDIRECT_URI,
        scope=SCOPES,
    )
)


# Function to get user profile
def get_user_profile():
    user = sp.current_user()
    return {
        "Display Name": user.get("display_name"),
        "User ID": user.get("id"),
        "Followers": user.get("followers", {}).get("total", 0),
        "Profile URL": user.get("external_urls", {}).get("spotify", ""),
    }


# Function to get recently played songs
def get_recently_played():
    results = sp.current_user_recently_played(limit=10)
    return [
        {
            "Track Name": item["track"]["name"],
            "Artist": item["track"]["artists"][0]["name"],
            "Played At": item["played_at"],
        }
        for item in results["items"]
    ]


# Function to get top artists
def get_top_artists():
    results = sp.current_user_top_artists(limit=10, time_range="medium_term")
    return [
        {
            "Artist Name": artist["name"],
            "Genres": artist["genres"],
            "Popularity": artist["popularity"],
        }
        for artist in results["items"]
    ]


# Function to get saved albums
def get_saved_albums():
    results = sp.current_user_saved_albums(limit=10)
    return [
        {
            "Album Name": album["album"]["name"],
            "Artist": album["album"]["artists"][0]["name"],
            "Release Date": album["album"]["release_date"],
        }
        for album in results["items"]
    ]


# Function to get top tracks
def get_top_tracks():
    results = sp.current_user_top_tracks(limit=10, time_range="medium_term")
    return [
        {
            "Track Name": track["name"],
            "Artist": track["artists"][0]["name"],
            "Album": track["album"]["name"],
            "Popularity": track["popularity"],
        }
        for track in results["items"]
    ]


# Function to get liked songs
def get_liked_songs():
    results = sp.current_user_saved_tracks(limit=10)
    return [
        {
            "Track Name": track["track"]["name"],
            "Artist": track["track"]["artists"][0]["name"],
            "Album": track["track"]["album"]["name"],
        }
        for track in results["items"]
    ]


# Function to get followed artists
def get_followed_artists():
    results = sp.current_user_followed_artists(limit=10)
    return [
        {
            "Artist Name": artist["name"],
            "Genres": artist["genres"],
            "Followers": artist["followers"]["total"],
        }
        for artist in results["artists"]["items"]
    ]


# Function to create documents for LangChain
def create_spotify_documents():
    all_data = []

    user_profile = get_user_profile()
    all_data.append(
        Document(
            page_content=f"User: {user_profile['Display Name']}, Followers: {user_profile['Followers']}"
        )
    )

    for track in get_recently_played():
        all_data.append(
            Document(
                page_content=f"Recently played: {track['Track Name']} by {track['Artist']}"
            )
        )

    for artist in get_top_artists():
        all_data.append(
            Document(
                page_content=f"Top artist: {artist['Artist Name']}, Genres: {', '.join(artist['Genres'])}"
            )
        )

    for album in get_saved_albums():
        all_data.append(
            Document(
                page_content=f"Saved album: {album['Album Name']} by {album['Artist']}"
            )
        )

    for track in get_top_tracks():
        all_data.append(
            Document(
                page_content=f"Top track: {track['Track Name']} by {track['Artist']}"
            )
        )

    for song in get_liked_songs():
        all_data.append(
            Document(
                page_content=f"Liked song: {song['Track Name']} by {song['Artist']}"
            )
        )

    for artist in get_followed_artists():
        all_data.append(
            Document(
                page_content=f"Followed artist: {artist['Artist Name']}, Genres: {', '.join(artist['Genres'])}"
            )
        )

    return all_data


# Setup LangChain: Embeddings, Vector Store & Retriever
documents = create_spotify_documents()
embedding_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
vectorstore = FAISS.from_documents(documents, embedding_model)
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

# Define LLM and Chat Prompt
spotify_prompt_template = """Answer the question based on the following Spotify data:
{context}

Question: {question}

Answer: """
spotify_prompt = ChatPromptTemplate.from_template(spotify_prompt_template)

llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash")

# Define RAG Chain
spotify_rag_chain = (
    {
        "context": retriever
        | (lambda docs: "\n\n".join(doc.page_content for doc in docs)),
        "question": RunnablePassthrough(),
    }
    | spotify_prompt
    | llm
    | StrOutputParser()
)


# Flask Route to Handle Chat Queries
@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()  # Get JSON data from frontend
        question = data.get("question", "")

        if not question:
            return jsonify({"error": "No question provided"}), 400

        response = spotify_rag_chain.invoke(question)  # Process question
        return jsonify({"response": response})

    except Exception as e:
        return jsonify({"error": str(e)}), 500  # Return error details


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
