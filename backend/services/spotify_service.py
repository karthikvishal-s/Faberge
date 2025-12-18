import requests
import time
import re # For cleaning track names
from concurrent.futures import ThreadPoolExecutor

def clean_name(text):
    """Removes 'ft.', 'feat', and extra brackets to help Spotify find the song."""
    return re.sub(r'\(.*?\)|\[.*?\]|feat\.|ft\.', '', text).strip()

def search_track(item, token):
    headers = {"Authorization": f"Bearer {token}"}
    
    # Clean the names to increase match probability
    t_name = clean_name(item.get('track', ''))
    a_name = clean_name(item.get('artist', ''))
    
    # Broader query: just "Artist Song" instead of strict "track:X artist:Y"
    query = f"{t_name} {a_name}"
    url = "https://api.spotify.com/v1/search"
    
    try:
        res = requests.get(
            url, 
            headers=headers, 
            params={"q": query, "type": "track", "limit": 1}, 
            timeout=3
        )
        
        if res.status_code == 200:
            data = res.json()
            tracks = data.get('tracks', {}).get('items', [])
            if tracks:
                t = tracks[0]
                return {
                    "id": t['id'],
                    "name": t['name'],
                    "artist": t['artists'][0]['name'],
                    "album_art": t['album']['images'][0]['url'] if t['album']['images'] else None,
                    "uri": t['uri']
                }
    except Exception as e:
        print(f"⏩ Failed to find: {query}")
    return None

def get_bulk_tracks(ai_list, token):
    if not ai_list: return []
    
    print(f"📡 [SPOTIFY] Searching for {len(ai_list)} tracks with Fuzzy Match...")
    with ThreadPoolExecutor(max_workers=15) as executor:
        results = list(executor.map(lambda item: search_track(item, token), ai_list))
    
    final_list = [r for r in results if r is not None]
    print(f"✅ [SPOTIFY] Found {len(final_list)}/15 tracks.")
    return final_list