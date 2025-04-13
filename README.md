# SpotifyHub

SpotifyHub is a web-based platform that integrates seamlessly with the Spotify API to deliver an enhanced and personalized music streaming experience. It combines real-time dashboards, AI-powered chatbot support, playlist generation, and automated newsletters into one streamlined solution.

---

## Features

- **Spotify API Integration** – Stream music directly and access user data in real time.
- **Interactive Dashboard** – Visualize listening activity, trends, and personalized stats through rich data visualizations.
- **AI Chatbot Support** – Ask questions and get insights about your listening data and newsletters via an AI assistant.
- **Email Newsletters** – Receive automated weekly summaries of your music behavior with embedded charts.
- **Playlist Generator** – Create playlists based on mood, weather, situation, or custom prompts using AI.
- **Automation** – Automated data collection, report generation, and email dispatch.
- **Modern UI** – Built with React and TailwindCSS for a fast, responsive, and user-friendly interface.

---

## Implemented Pages

- **Overview Page** – Real-time insights on user activity.
- **Artist Rankings Page** – Displays top artists based on listening patterns.
- **Genre Insights Page** – Analyzes music genre distribution.
- **Trending Tracks Page** – Shows currently trending songs.
- **My Listening Page** – Personalized dashboard with listening history.
- **Recommendations Page** – AI-powered music suggestions.
- **Chatbot Page** – Query your dashboard data through an AI assistant.
- **Send Newsletters Page** – Schedule and send insights via email.
- **Playlist Generator Page** – Create AI-based playlists from user prompts.
- **Login Page** – Handles user authentication securely.

---

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- Python 3.x
- Redis Server
- MySQL
---
## Setup

### Frontend Setup

1. Navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Run the development server:
    ```bash
    npm run dev
    ```

### 2. Backend Setup

The backend consists of a Node.js server, a Python-based chatbot API, and a newsletter service.

#### Install Dependencies

In the `backend` directory, install required dependencies:

```sh
npm install
pip install -r requirements.txt
```

### Server Setup

1. Navigate to the backend directory:
    ```bash
    cd backend
    ```

2. Start the backend server:
    ```bash
    node server.js
    ```

### Chatbot Setup

1. Start the chatbot server:
    ```bash
    python chatbot_api.py
    ```

### Newsletter Setup (Celery and Redis)

1. Start Redis server (ensure Redis is installed):
    ```bash
    redis-server
    ```

2. In a separate terminal, start Celery worker:
    ```bash
    celery -A celery_config worker --pool=solo --loglevel=info
    ```

3. Start Celery scheduler:
    ```bash
    celery -A celery_config beat --loglevel=info
    ```

---
## Usage

Once the application is set up and running, follow these steps to use it:

1. **Open the frontend** in your browser at `http://localhost:3000`.
2. **Login** using your Spotify account (OAuth authentication is required).
3. **Navigate through the pages**:
   - **Overview Page**: Displays your user activity and trends.
   - **Artist Rankings**: View trending artists based on your listening habits.
   - **Recommendations Page**: Get personalized song and artist recommendations.
   - **Chatbot Page**: Interact with the AI-powered chatbot to ask questions about your data.
4. **Enjoy automated newsletters**: You'll receive periodic emails summarizing key insights from your listening activity.

For more information, check the individual page documentation or reach out to the project maintainers.
---
## Technologies Used

- **Frontend**: React, React Router, Tailwind CSS, Axios, Framer Motion, Recharts
- **Backend**: Node.js, Express.js, MySQL
- **Chatbot**: Flask, RAG System, Google Gemini AI, FAISS, Hugging Face API
- **Newsletter**: Python, Celery, Redis, SMTP
- **API Integration**: Spotify API
- **Others**: Vite (for fast development), Lucide React (icons)
---
## API Documentation

The backend exposes a RESTful API for accessing user data and interacting with Spotify.

**Authentication**:
- Use Spotify OAuth to authenticate users and get access tokens for Spotify API calls.

**Endpoints**:
- `GET /api/user/activity`: Fetches user listening activity.
- `GET /api/recommendations`: Provides personalized song recommendations.
- `POST /api/chatbot/query`: Send a query to the AI-powered chatbot.

---
## Credits

This project was developed during the **Texas Instruments Wise Hackathon 2025**.

### Contributors
- **Navneet Kaur**
- **Anushka Singh**
- **Mansa Mahendru** 
- **Archita Das** 

We would like to extend our gratitude to Texas Instruments for organizing the hackathon and providing us with the opportunity to bring this project to life.

