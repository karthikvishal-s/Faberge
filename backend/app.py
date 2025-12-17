import os
import json
import requests
import google.generativeai as genai
from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
from spotipy.oauth2 import SpotifyOAuth
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app)

# --- SAAS QUOTA & MODEL ROTATION ---
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model_tracker = {
    "models": ["gemini-2.5-flash", "gemini-2.5-flash-lite"],
    "current_index": 0,
    "count": 0,
    "last_reset": datetime.now().date()
}

def get_rotated_model():
    global model_tracker
    today = datetime.now().date()
    if today > model_tracker["last_reset"]:
        model_tracker.update({"count": 0, "current_index": 0, "last_reset": today})
    
    if model_tracker["count"] >= 20:
        model_tracker["current_index"] = (model_tracker["current_index"] + 1) % len(model_tracker["models"])
        model_tracker["count"] = 0
    
    return genai.GenerativeModel(f"models/{model_tracker['models'][model_tracker['current_index']]}")

# --- SPOTIFY SETUP ---
sp_oauth = SpotifyOAuth(
    client_id=os.getenv("SPOTIPY_CLIENT_ID"),
    client_secret=os.getenv("SPOTIPY_CLIENT_SECRET"),
    redirect_uri=os.getenv("SPOTIPY_REDIRECT_URI"),
    scope="playlist-modify-public user-top-read user-read-private"
)

def search_spotify_track(item, token):
    headers = {"Authorization": f"Bearer {token}"}
    query = f"track:{item['track']} artist:{item['artist']}"
    try:
        res = requests.get("https://api.spotify.com/v1/search", 
                           headers=headers, params={"q": query, "type": "track", "limit": 1})
        t = res.json()['tracks']['items'][0]
        return {"id": t['id'], "name": t['name'], "artist": t['artists'][0]['name'],
                "album_art": t['album']['images'][0]['url'] if t['album']['images'] else None, "uri": t['uri']}
    except: return None

@app.route('/questions', methods=['GET'])
def questions():
    return jsonify([
        {"id": "q1", "text": "Current energy as a movie genre?", "options": ["Indie Coming-of-age", "Noir Thriller", "Action", "Romance", "Sci-Fi", "Drama"]},
        {"id": "q2", "text": "Current room lighting?", "options": ["Golden Hour", "Neon Purple", "Candlelight", "Studio White", "Shadows", "Fairy Lights"]},
        {"id": "q3", "text": "Driving on an empty road... where?", "options": ["Coastline", "Pine Forest", "Tokyo Streets", "Desert", "Mountains", "Rainy Alley"]},
        {"id": "q4", "text": "Social Battery?", "options": ["5%", "25%", "50%", "75%", "100%", "120%"]},
        {"id": "q5", "text": "Taste of your mood?", "options": ["Matcha", "Espresso", "Spicy Chili", "Strawberry", "Rain Water", "Champagne"]},
        {"id": "q6", "text": "Nostalgic era?", "options": ["70s", "80s", "90s", "00s", "Future", "Victorian"]},
        {"id": "q7", "text": "Desired feeling?", "options": ["Invincible", "Melancholic", "Focused", "Cool", "Light", "Angry"]},
        {"id": "q8", "text": "Core aesthetic?", "options": ["Cottagecore", "Cybercore", "Academia", "Minimalism", "Glitchcore", "Dreamcore"]},
        {"id": "q9", "text": "Main character moment?", "options": ["Rainy run", "Train window", "Party entrance", "Library", "2AM Drive", "Field wake-up"]},
        {"id": "q10", "text": "Your thoughts as a sound?", "options": ["Waves", "Vinyl crackle", "Heartbeat", "Piano", "Static", "Bass drop"]}
    ])

@app.route('/login')
def login():
    return jsonify({"auth_url": sp_oauth.get_authorize_url()})

@app.route('/callback')
def callback():
    code = request.args.get('code')
    token_info = sp_oauth.get_access_token(code)
    access_token = token_info['access_token'] if isinstance(token_info, dict) else token_info
    return redirect(f"http://localhost:3030/quiz?token={access_token}")

@app.route('/generate', methods=['POST'])
def generate():
    global model_tracker
    try:
        data = request.json
        token = data.get('token')
        answers = data.get('answers')
        lang = data.get('language', 'en')

        print(f"🚀 [1/3] Starting generation for lang: {lang}")
        
        # 1. Ask Gemini
        model = get_rotated_model()
        prompt = f"Recommend 15 real songs based on these vibe answers: {json.dumps(answers)}. Language: {lang}. Return ONLY a JSON array of objects with 'artist' and 'track' keys."
        
        response = model.generate_content(prompt)
        model_tracker["count"] += 1
        
        raw_text = response.text.replace("```json", "").replace("```", "").strip()
        ai_recommendations = json.loads(raw_text)
        print(f"✅ [2/3] Gemini suggested {len(ai_recommendations)} songs.")

        # 2. Optimized Parallel Search
        # We increase max_workers to 15 so all songs are searched at the EXACT same time
        print(f"📡 [3/3] Searching Spotify for 15 tracks...")
        with ThreadPoolExecutor(max_workers=15) as executor:
            results = list(executor.map(lambda item: search_spotify_track(item, token), ai_recommendations))
        
        final_tracks = [r for r in results if r is not None]
        print(f"🎉 Done! Found {len(final_tracks)}/15 tracks.")
        
        return jsonify(final_tracks)

    except Exception as e:
        print(f"❌ GENERATE ERROR: {e}")
        return jsonify({"error": str(e)}), 500
@app.route('/export', methods=['POST'])
def export_playlist():
    data = request.json
    token, track_uris = data.get('token'), data.get('track_uris')
    name = data.get('playlist_name', "VibeCheck AI")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        user_id = requests.get("https://api.spotify.com/v1/me", headers=headers).json()['id']
        playlist = requests.post(f"https://api.spotify.com/v1/users/{user_id}/playlists", 
                                headers=headers, json={"name": name, "public": False}).json()
        requests.post(f"https://api.spotify.com/v1/playlists/{playlist['id']}/tracks", headers=headers, json={"uris": track_uris})
        return jsonify({"status": "success", "url": playlist['external_urls']['spotify']})
    except Exception as e: return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=4040, debug=True)