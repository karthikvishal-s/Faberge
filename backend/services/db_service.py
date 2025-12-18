import os
from supabase import create_client

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def sync_user(email, spotify_id):
    return supabase.table("user_stats").upsert({
        "email": email, "spotify_id": spotify_id
    }).execute()

def update_user_vibe(email, tracks):
    # Increment count using the SQL function we created
    supabase.rpc('increment_search_count', {'user_email': email}).execute()
    # Save the last result
    return supabase.table("user_stats").update({"last_vibe_json": tracks}).eq("email", email).execute()

def get_last_vibe(email):
    res = supabase.table("user_stats").select("last_vibe_json").eq("email", email).execute()
    return res.data[0]['last_vibe_json'] if res.data else None