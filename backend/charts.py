# charts.py

import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import os

# Create a folder to store graphs
os.makedirs('charts', exist_ok=True)

import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd

def generate_weekly_listening_chart(user_id, distribution, labels):
    
    if not distribution or not labels or len(distribution) != len(labels):
        return None

    df = pd.DataFrame({
        'Date': labels,
        'Listening Hours': distribution
    })

    plt.figure(figsize=(10, 5))
    sns.lineplot(data=df, x='Date', y='Listening Hours', marker='o', linewidth=2.5, color='#1DB954')
    plt.title(f'Weekly Listening Insights', fontsize=14)
    plt.xlabel('Date')
    plt.ylabel('Total Listening Time (hrs)')
    plt.xticks(rotation=0)
    plt.grid(True, linestyle='--', alpha=0.6)

    path = f'charts/{user_id}_weekly_listening.png'
    plt.tight_layout()
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

