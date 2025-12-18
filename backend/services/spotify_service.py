import requests
from concurrent.futures import ThreadPoolExecutor

def search_track(item, token):
    headers = {"Authorization": f"Bearer {token}"}
    query = f"track:{item['track']} artist:{item['artist']}"
    # Using direct Spotify API
    url = "https://api.spotify.com/v1/search"
    try:
        res = requests.get(url, headers=headers, params={"q": query, "type": "track", "limit": 1}, timeout=5)
        t = res.json()['tracks']['items'][0]
        return {
            "id": t['id'], 
            "name": t['name'], 
            "artist": t['artists'][0]['name'],
            "album_art": t['album']['images'][0]['url'], 
            "uri": t['uri']
        }
    except: return None

def get_bulk_tracks(ai_list, token):
    with ThreadPoolExecutor(max_workers=15) as executor:
        results = list(executor.map(lambda item: search_track(item, token), ai_list))
    return [r for r in results if r is not None]