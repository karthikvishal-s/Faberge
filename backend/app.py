import os
import json
import requests
import google.generativeai as genai
from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
from spotipy.oauth2 import SpotifyOAuth
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app)

# Configure Gemini AI
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-2.5-flash')

# Spotify Authentication Setup
sp_oauth = SpotifyOAuth(
    client_id=os.getenv("SPOTIPY_CLIENT_ID"),
    client_secret=os.getenv("SPOTIPY_CLIENT_SECRET"),
    redirect_uri=os.getenv("SPOTIPY_REDIRECT_URI"),
    scope="playlist-modify-public user-top-read user-read-private"
)

# --- HELPER FUNCTIONS ---

def get_questions_list():
    """Missing question data that the frontend needs"""
    return [
        {"id": "q1", "text": "What's the weather like in your soul right now?", "options": ["Sunny", "Rainy", "Thunderstorm", "Foggy"]},
        {"id": "q2", "text": "Choose a color for your current energy:", "options": ["Neon Pink", "Deep Blue", "Electric Yellow", "Midnight Black"]},
        {"id": "q3", "text": "If your mood was a landscape, it would be:", "options": ["A crowded city", "A quiet forest", "A beach at sunset", "Deep space"]}
    ]

def search_spotify_track(item, token):
    headers = {"Authorization": f"Bearer {token}"}
    query = f"track:{item['track']} artist:{item['artist']}"
    search_url = "https://api.spotify.com/v1/search"
    
    try:
        response = requests.get(search_url, headers=headers, params={"q": query, "type": "track", "limit": 1})
        data = response.json()
        if data.get('tracks', {}).get('items'):
            track = data['tracks']['items'][0]
            return {
                "id": track['id'],
                "name": track['name'],
                "artist": track['artists'][0]['name'],
                "album_art": track['album']['images'][0]['url'] if track['album']['images'] else None,
                "uri": track['uri']
            }
    except Exception as e:
        print(f"Search error: {e}")
    return None

# --- ROUTES ---

@app.route('/login')
def login():
    auth_url = sp_oauth.get_authorize_url()
    return jsonify({"auth_url": auth_url})

@app.route('/callback')
def callback():
    code = request.args.get('code')
    if not code:
        return jsonify({"error": "No code provided"}), 400
    
    try:
        # FIX: Remove as_dict=True to avoid the DeprecationWarning
        token_info = sp_oauth.get_access_token(code)
        
        # In newer versions, this returns a string. In older, a dict.
        access_token = token_info['access_token'] if isinstance(token_info, dict) else token_info
        
        return redirect(f"http://localhost:3030/quiz?token={access_token}")
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/questions', methods=['GET'])
def questions():
    """This was the missing route causing your 404"""
    return jsonify(get_questions_list())

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    token, answers = data.get('token'), data.get('answers')

    # Precise Prompt to ensure strict JSON output
    prompt = f"""
    Suggest 15 real songs based on these vibe answers: {json.dumps(answers)}.
    Return ONLY a JSON array of objects with keys "artist" and "track". 
    No conversational text before or after the JSON.
    """

    try:
        print("📡 Sending prompt to Gemini...")
        response = model.generate_content(prompt)
        
        # 1. Check if the response was blocked by safety filters
        if not response.candidates or not response.candidates[0].content.parts:
            print("❌ ERROR: Gemini blocked the response.")
            return jsonify({"error": "Content blocked by AI safety filters"}), 400

        # 2. Extract and parse JSON
        raw_text = response.text.replace("```json", "").replace("```", "").strip()
        ai_recommendations = json.loads(raw_text)

        # 3. Parallel Spotify Search
        with ThreadPoolExecutor(max_workers=10) as executor:
            results = list(executor.map(lambda item: search_spotify_track(item, token), ai_recommendations))
        
        tracks = [r for r in results if r is not None]
        return jsonify(tracks)

    except json.JSONDecodeError as e:
        print(f"❌ JSON PARSE ERROR: {e}\nRaw Response: {response.text}")
        return jsonify({"error": "AI returned malformed data"}), 500
    except Exception as e:
        print(f"❌ CRITICAL GENERATE ERROR: {e}")
        return jsonify({"error": str(e)}), 500
@app.route('/export', methods=['POST'])
def export_playlist():
    data = request.json
    token, track_uris = data.get('token'), data.get('track_uris')
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    try:
        user_id = requests.get("https://api.spotify.com/v1/me", headers=headers).json()['id']
        playlist = requests.post(f"https://api.spotify.com/v1/users/{user_id}/playlists", 
                                headers=headers, json={"name": "VibeCheck AI", "public": False}).json()
        requests.post(f"https://api.spotify.com/v1/playlists/{playlist['id']}/tracks", headers=headers, json={"uris": track_uris})
        return jsonify({"status": "success", "url": playlist['external_urls']['spotify']})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=4040, debug=True)