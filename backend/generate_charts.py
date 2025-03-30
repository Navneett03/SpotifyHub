import matplotlib.pyplot as plt # type: ignore
import json
import sys

def plot_listening_trends(trends_json):
    trends = json.loads(trends_json)
    dates = list(trends.keys())
    minutes = list(trends.values())

    plt.figure(figsize=(8,4))
    plt.plot(dates, minutes, marker='o', color='green', linestyle='-')
    plt.xlabel('Date')
    plt.ylabel('Listening Time (Minutes)')
    plt.title('Listening Trends Over the Week')
    plt.grid(True)
    plt.savefig('listening_trends.png')

def plot_genre_distribution(genres_json):
    genres = json.loads(genres_json)
    labels = list(genres.keys())
    values = list(genres.values())

    plt.figure(figsize=(6,6))
    plt.pie(values, labels=labels, autopct='%1.1f%%', startangle=140)
    plt.title('Genre Distribution')
    plt.savefig('genre_distribution.png')

if __name__ == "__main__":
    trends_json = sys.argv[1]
    genres_json = sys.argv[2]
    
    plot_listening_trends(trends_json)
    plot_genre_distribution(genres_json)
