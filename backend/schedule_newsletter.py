# import schedule
# import time
# from fetch_and_store import fetch_all_users_data
# from update_weekly import main as update_weekly_main
# from send_newsletter import send_all_newsletters


# def weekly_job():
#     print("Starting weekly update and newsletter distribution...")
#     # Fetch new data
#     fetch_all_users_data()
#     # Update analytics and generate charts
#     update_weekly_main()
#     # Send newsletters
#     send_all_newsletters()
#     print("Weekly update and newsletter distribution completed.")


# # Schedule to run every Monday at 9 AM
# schedule.every().monday.at("09:00").do(weekly_job)

# if __name__ == "__main__":
#     print("Scheduler started. Waiting for scheduled tasks...")
#     while True:
#         schedule.run_pending()
#         time.sleep(60)  # Check every minute
