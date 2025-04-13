# charts.py

import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import os

# Create a folder to store graphs
os.makedirs('charts', exist_ok=True)

def generate_weekly_listening_chart(user_id, daily_listening):
    if not daily_listening:
        return None

    # Map day indices to names (assuming Monday = 0)
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    df = pd.DataFrame({
        'Day': days,
        'Listening Hours': daily_listening
    })

    plt.figure(figsize=(10, 5))
    sns.lineplot(data=df, x='Day', y='Listening Hours', marker='o', linewidth=2.5, color='#1DB954')
    plt.title('Weekly Listening Insights')
    plt.xlabel('Day of the Week')
    plt.ylabel('Total Listening Time (hrs)')
    plt.grid(True, linestyle='--', alpha=0.6)

    path = f'charts/{user_id}_weekly_listening.png'
    plt.savefig(path, bbox_inches='tight')
    plt.close()
    return path

def generate_genre_distribution_chart(user_id, genres):
    if not genres:
        return None

    df = pd.DataFrame(list(genres.items()), columns=['Genre', 'Count'])
    df = df.sort_values(by='Count', ascending=False).head(10)

    # colors = sns.color_palette("mako", len(df))  # Correct way to get mako colors

    plt.figure(figsize=(8, 8))
    plt.pie(
        df['Count'],
        labels=df['Genre'],
        autopct='%1.1f%%',
        startangle=140,
        # colors=colors
    )
    plt.title('Top 10 Genre Distribution')
    plt.axis('equal')

    path = f'charts/{user_id}_genre_distribution.png'
    plt.savefig(path, bbox_inches='tight')
    plt.close()
    return path

