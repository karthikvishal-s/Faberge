import requests
import time
from concurrent.futures import ThreadPoolExecutor

def search_track(item, token):
    headers = {"Authorization": f"Bearer {token}"}
    query = f"track:{item['track']} artist:{item['artist']}"
    url = "https://api.spotify.com/v1/search"
    
    start_time = time.time()
    try:
        # Strict 2.5s timeout for speed
        res = requests.get(url, headers=headers, params={"q": query, "type": "track", "limit": 1}, timeout=2.5)
        
        if res.status_code == 200:
            data = res.json()
            if data.get('tracks', {}).get('items'):
                t = data['tracks']['items'][0]
                return {
                    "id": t['id'], "name": t['name'], "artist": t['artists'][0]['name'],
                    "album_art": t['album']['images'][0]['url'] if t['album']['images'] else None, "uri": t['uri']
                }
    except Exception:
        pass # Silently fail to keep the list moving
    return None

def get_bulk_tracks(ai_list, token):
    print(f"📡 [SPOTIFY] Searching for {len(ai_list)} tracks in parallel...")
    start = time.time()
    
    with ThreadPoolExecutor(max_workers=15) as executor:
        results = list(executor.map(lambda item: search_track(item, token), ai_list))
    
    end = time.time()
    final_list = [r for r in results if r is not None]
    print(f"✅ [SPOTIFY] Search complete. Found {len(final_list)} tracks in {round(end - start, 2)}s")
    return final_list