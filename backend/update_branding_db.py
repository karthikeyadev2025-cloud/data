import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env if present
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

from db import sb

def run():
    print("Connecting to Supabase...")
    try:
        client = sb()
    except Exception as e:
        print(f"Error initializing Supabase client: {e}")
        sys.exit(1)

    print("Fetching existing platform_settings...")
    r = client.table("platform_settings").select("*").limit(1).execute()
    if r.data:
        row_id = r.data[0]['id']
        print(f"Found existing record with ID: {row_id}")
        update_res = client.table("platform_settings").update({
            "brand_name": "INeedLeads",
            "footer_text": "An innovation by NIKKI TECH LABS"
        }).eq("id", row_id).execute()
        print("Update successful! Result:", update_res.data)
    else:
        print("No platform_settings record found. Inserting default seed...")
        insert_res = client.table("platform_settings").insert({
            "brand_name": "INeedLeads",
            "footer_text": "An innovation by NIKKI TECH LABS",
            "free_trial_credits": 25
        }).execute()
        print("Insert successful! Result:", insert_res.data)

if __name__ == "__main__":
    run()
