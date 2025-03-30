# SpotifyHub

SpotifyHub is a web-based application that integrates with Spotify to provide users with enhanced music streaming experiences, including personalized recommendations, chatbot assistance, email notifications, and a comprehensive dashboard for data insights.

## Features

- **Spotify API Integration**: Connects to Spotify for seamless music playback.
- **Interactive Dashboard**: Displays real-time data, trends, and user activity with filters and drill-down capabilities.
- **Chatbot Support**: AI-powered chatbot that answers questions about data from the dashboard and newsletter.
- **Email Newsletters**: Scheduled newsletters summarizing key insights with visualizations.
- **Automation**: Scripts for fetching data, generating newsletters, and sending emails automatically.
- **Modern UI**: Built with React and TailwindCSS for a responsive experience.

## Implemented Pages

1. **Overview Page** - Displays real-time user activity and insights with visualizations.
2. **Artist Rankings Page** - Ranks artists based on listening trends, with filters.
3. **Genre Insights Page** - Shows distribution of music genres in listening habits.
4. **Trending Tracks Page** - Displays currently trending tracks and popular songs.
5. **My Listening Page** - Personalized dashboard of a user's listening history.
6. **Recommendations Page** - Suggests music based on user preferences.
7. **Chatbot Page** - Interactive chatbot for answering queries on dashboard data.
8. **Send Newsletters Page** - Facilitates scheduling and sending newsletters.
9. **Login Page** - Handles authentication for personalized access.

## Installation & Setup

### 1. Frontend Setup

Navigate to the main project directory and run the following commands:

```sh
npm install
npm run dev
```

This starts the frontend development server, typically accessible at `http://localhost:5174`.

### 2. Backend Setup

The backend consists of both a Node.js server and a Python-based chatbot API.

#### Install Dependencies

In the `backend` directory, install required dependencies:

```sh
npm install
pip install -r requirements.txt
```

#### Start Backend Services

Run the following commands in separate terminal windows:

1. Start the chatbot API (Python):

```sh
python chatbot.api
```

2. Start the Node.js server:

```sh
node server.js
```

3. Start the email sender service:

```sh
node send_email.js
```

## Usage

Once all services are running:

- Open `http://localhost:5174` in a browser to access the application.
- Login with Spotify credentials to enable music playback.
- Explore the interactive dashboard for insights and trends.
- Interact with the chatbot for data-driven responses.
- Receive curated email newsletters with key insights.

## Technologies Used

- **Frontend**: React, TailwindCSS, Vite
- **Backend**: Node.js, Express, Python (Flask for chatbot API)
- **Database**: (If applicable, mention here)
- **APIs**: Spotify Web API

## Contribution

- **Anushka Singh**
- **Navneet Kaur**
- **Archita Das**
- **Mansa Mahendru**
