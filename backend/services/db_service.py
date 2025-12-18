import os
from supabase import create_client

# Initialize Supabase
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase = create_client(url, key)

def sync_user_data(email, spotify_id):
    """Called on login."""
    return supabase.table("user_stats").upsert({
        "email": email, "spotify_id": spotify_id
    }).execute()

def save_generation(email, tracks):
    """Called after AI finishes."""
    # Increment count via RPC function we made
    supabase.rpc('increment_search_count', {'user_email': email}).execute()
    # Save the playlist JSON
    return supabase.table("user_stats").update({
        "last_vibe_json": tracks
    }).eq("email", email).execute()

def fetch_last_vibe(email):
    """Called by frontend to see if user has a session."""
    res = supabase.table("user_stats").select("last_vibe_json").eq("email", email).execute()
    if res.data and res.data[0]['last_vibe_json']:
        return res.data[0]['last_vibe_json']
    return None