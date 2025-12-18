from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
from spotipy.oauth2 import SpotifyOAuth
import requests
import os
from dotenv import load_dotenv

load_dotenv()

from services.ai_service import get_recommendations
from services.spotify_service import get_bulk_tracks
from services.db_service import sync_user_data, save_generation, fetch_last_vibe

app = Flask(__name__)
CORS(app)

sp_oauth = SpotifyOAuth(
    client_id=os.getenv("SPOTIPY_CLIENT_ID"),
    client_secret=os.getenv("SPOTIPY_CLIENT_SECRET"),
    redirect_uri=os.getenv("SPOTIPY_REDIRECT_URI"),
    scope="user-read-email user-top-read user-read-private playlist-modify-public playlist-modify-private"
)

@app.route('/questions')
def questions():
    # The 5 Crucial Universal Questions
    return jsonify([
        {"id": "genre", "text": "What is the primary sonic foundation?", "options": ["Classical/Jazz", "Rock/Indie", "Pop/Mainstream", "Electronic/Dance", "Hip-Hop/R&B", "Folk/Acoustic"]},
        {"id": "era", "text": "Which timeline should we inhabit?", "options": ["Golden Classics (60s-70s)", "Vintage Nostalgia (80s-90s)", "Modern Transition (00s-10s)", "The Cutting Edge (Present)"]},
        {"id": "mood", "text": "What is the current emotional frequency?", "options": ["High Energy/Hype", "Deep Focus/Steady", "Melancholic/Reflective", "Pure Relaxation/Calm"]},
        {"id": "setting", "text": "Where is this sound living?", "options": ["A Late Night Drive", "Intense Physical Labor", "Quiet Morning Solitude", "A Social Celebration"]},
        {"id": "discovery", "text": "How deep should we dig?", "options": ["The Chart Toppers", "Hidden Gems", "Complete Underground", "A Balanced Blend"]}
    ])

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    print("\n🪄 GENERATING FROM VIBE PARAGRAPH...")
    
    # 1. Get AI response (Fixed the NoneType error by handling the return)
    ai_res = get_recommendations(data.get('answers'), data.get('language', 'English'))
    
    if not ai_res:
        return jsonify({"error": "AI failed to generate vibe"}), 500

    # 2. Extract tracks and enrich with Spotify metadata
    ai_tracks = ai_res.get('tracks', [])
    enriched_tracks = get_bulk_tracks(ai_tracks, data.get('token'))
    
    full_payload = {
        "summary": ai_res.get('summary', "A custom selection for your mood."),
        "vibe_stats": ai_res.get('vibe_stats', []),
        "tracks": enriched_tracks
    }
    
    save_generation(data.get('email'), full_payload)
    return jsonify(full_payload)
@app.route('/login')
def login():
    return jsonify({"auth_url": sp_oauth.get_authorize_url()})

@app.route('/callback')
def callback():
    code = request.args.get('code')
    token = sp_oauth.get_access_token(code, as_dict=False)
    user = requests.get("https://api.spotify.com/v1/me", headers={"Authorization": f"Bearer {token}"}).json()
    sync_user_data(user.get('email'), user.get('id'))
    return redirect(f"http://localhost:3030/quiz?token={token}&email={user.get('email')}")

@app.route('/get-history', methods=['GET'])
def get_history():
    email = request.args.get('email')
    print(f"🔍 [DB] Checking history for {email}")
    history = fetch_last_vibe(email)
    return jsonify(history if history else [])


@app.route('/export', methods=['POST'])
def export():
    try:
        data = request.json
        token, track_uris, name = data.get('token'), data.get('uris'), data.get('name')
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        
        # Get User ID
        me = requests.get("https://api.spotify.com/v1/me", headers=headers).json()
        
        # Create Playlist
        pl_res = requests.post(f"https://api.spotify.com/v1/users/{me['id']}/playlists", 
                               headers=headers, 
                               json={"name": name, "description": "Curated by Fabergé AI", "public": False}).json()
        
        # Add Tracks (Must be in URI format: spotify:track:ID)
        requests.post(f"https://api.spotify.com/v1/playlists/{pl_res['id']}/tracks", 
                      headers=headers, 
                      json={"uris": track_uris})
        
        return jsonify({"url": pl_res['external_urls']['spotify']})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=4040, debug=True)