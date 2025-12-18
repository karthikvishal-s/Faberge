import os
from supabase import create_client

def get_db_client():
    return create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def sync_user_data(email, spotify_id):
    db = get_db_client()
    return db.table("user_stats").upsert({"email": email, "spotify_id": spotify_id}).execute()

def save_generation(email, tracks):
    db = get_db_client()
    db.rpc('increment_search_count', {'user_email': email}).execute()
    return db.table("user_stats").update({"last_vibe_json": tracks}).eq("email", email).execute()

def fetch_last_vibe(email):
    db = get_db_client()
    res = db.table("user_stats").select("last_vibe_json").eq("email", email).execute()
    return res.data[0]['last_vibe_json'] if res.data else None