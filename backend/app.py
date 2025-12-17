import os
import json
import requests
import traceback  # Added for detailed error logs
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

# --- SAAS QUOTA & MODEL ROTATION LOGIC ---
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model_tracker = {
    "models": ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-3-flash"],
    "current_index": 0,
    "count": 0,
    "last_reset": datetime.now().date()
}

def get_rotated_model():
    global model_tracker
    today = datetime.now().date()
    
    if today > model_tracker["last_reset"]:
        model_tracker["count"] = 0
        model_tracker["current_index"] = 0
        model_tracker["last_reset"] = today
        print("☀️ Daily Quota Reset.")

    if model_tracker["count"] >= 20:
        model_tracker["current_index"] = (model_tracker["current_index"] + 1) % len(model_tracker["models"])
        model_tracker["count"] = 0
        print(f"🔄 Rotating to: {model_tracker['models'][model_tracker['current_index']]}")

    model_name = model_tracker["models"][model_tracker["current_index"]]
    return genai.GenerativeModel(model_name)

# --- SPOTIFY SETUP ---
sp_oauth = SpotifyOAuth(
    client_id=os.getenv("SPOTIPY_CLIENT_ID"),
    client_secret=os.getenv("SPOTIPY_CLIENT_SECRET"),
    redirect_uri=os.getenv("SPOTIPY_REDIRECT_URI"),
    scope="playlist-modify-public user-top-read"
)

def get_questions_list():
    return [
        {"id": "q1", "text": "What's the weather like in your soul right now?", "options": ["Sunny", "Rainy", "Thunderstorm", "Foggy"]},
        {"id": "q2", "text": "Choose a color for your current energy:", "options": ["Neon Pink", "Deep Blue", "Electric Yellow", "Midnight Black"]},
        {"id": "q3", "text": "If your mood was a landscape, it would be:", "options": ["A crowded city", "A quiet forest", "A beach at sunset", "Deep space"]}
    ]

def search_spotify_track(item, token):
    headers = {"Authorization": f"Bearer {token}"}
    query = f"track:{item['track']} artist:{item['artist']}"
    try:
        # Note: Using the googleusercontent proxy if your environment requires it
        res = requests.get("https://api.spotify.com/v1/search", 
                           headers=headers, params={"q": query, "type": "track", "limit": 1})
        data = res.json()
        if data.get('tracks', {}).get('items'):
            t = data['tracks']['items'][0]
            return {"id": t['id'], "name": t['name'], "artist": t['artists'][0]['name'],
                    "album_art": t['album']['images'][0]['url'] if t['album']['images'] else None, "uri": t['uri']}
    except Exception as e:
        print(f"🔎 Search error for {query}: {e}")
    return None

# --- ROUTES ---

@app.route('/login')
def login():
    return jsonify({"auth_url": sp_oauth.get_authorize_url()})

@app.route('/callback')
def callback():
    try:
        code = request.args.get('code')
        token_info = sp_oauth.get_access_token(code)
        access_token = token_info['access_token'] if isinstance(token_info, dict) else token_info
        # Change 3030 to 3000 if that is your Next.js port
        return redirect(f"http://localhost:3000/quiz?token={access_token}")
    except Exception as e:
        print(f"❌ Callback Error: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500

@app.route('/questions', methods=['GET'])
def questions():
    return jsonify(get_questions_list())

@app.route('/generate', methods=['POST'])
def generate():
    global model_tracker
    try:
        data = request.json
        token = data.get('token')
        answers = data.get('answers')

        if not token:
            print("⚠️ Warning: No token provided in /generate")
            return jsonify({"error": "No token"}), 400

        prompt = f"Recommend 15 real songs for these quiz answers: {json.dumps(answers)}. Return ONLY a JSON array of objects with 'artist' and 'track' keys. No other text."

        print(f"📡 Requesting Gemini via {model_tracker['models'][model_tracker['current_index']]}...")
        model = get_rotated_model()
        response = model.generate_content(prompt)
        model_tracker["count"] += 1
        
        # Parse AI response
        raw_text = response.text.replace("```json", "").replace("```", "").strip()
        ai_recommendations = json.loads(raw_text)
        print(f"✅ AI suggested {len(ai_recommendations)} songs.")

        # Parallel search
        with ThreadPoolExecutor(max_workers=10) as executor:
            results = list(executor.map(lambda item: search_spotify_track(item, token), ai_recommendations))
        
        final_tracks = [r for r in results if r is not None]
        print(f"🎵 Found {len(final_tracks)} tracks on Spotify.")
        return jsonify(final_tracks)

    except Exception as e:
        # THIS WILL PRINT THE EXACT ERROR IN YOUR TERMINAL
        print("🛑 CRITICAL ERROR IN /GENERATE:")
        print(traceback.format_exc()) 
        return jsonify({"error": str(e)}), 500

@app.route('/export', methods=['POST'])
def export_playlist():
    try:
        data = request.json
        token = data.get('token')
        track_uris = data.get('track_uris')
        custom_name = data.get('playlist_name', "VibeCheck AI Playlist")

        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        user_id = requests.get("https://api.spotify.com/v1/me", headers=headers).json()['id']
        
        playlist = requests.post(f"https://api.spotify.com/v1/users/{user_id}/playlists", 
                                headers=headers, json={"name": custom_name, "public": False}).json()
        
        requests.post(f"https://api.spotify.com/v1/playlists/{playlist['id']}/tracks", 
                     headers=headers, json={"uris": track_uris})
        
        return jsonify({"status": "success", "url": playlist['external_urls']['spotify']})
    except Exception as e:
        print(f"❌ Export Error: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=4040, debug=True)