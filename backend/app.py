from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
from spotipy.oauth2 import SpotifyOAuth
import requests
import os
from dotenv import load_dotenv

# Load Environment Variables
load_dotenv()

# Import Fragments from your services folder
from services.ai_service import get_recommendations
from services.spotify_service import get_bulk_tracks
from services.db_service import sync_user_data, save_generation, fetch_last_vibe

app = Flask(__name__)
CORS(app)

# Spotify Auth Configuration
sp_oauth = SpotifyOAuth(
    client_id=os.getenv("SPOTIPY_CLIENT_ID"),
    client_secret=os.getenv("SPOTIPY_CLIENT_SECRET"),
    redirect_uri=os.getenv("SPOTIPY_REDIRECT_URI"),
    scope="user-read-email user-top-read user-read-private playlist-modify-public playlist-modify-private"
)

# --- 1. DATA ROUTES ---

@app.route('/questions', methods=['GET'])
def questions():
    """Returns the 10 high-fidelity vibe questions for the frontend."""
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

# --- 2. AUTH ROUTES ---

@app.route('/login')
def login():
    return jsonify({"auth_url": sp_oauth.get_authorize_url()})

@app.route('/callback')
def callback():
    code = request.args.get('code')
    token = sp_oauth.get_access_token(code, as_dict=False)
    
    # Get user profile info
    user_res = requests.get("https://api.spotify.com/v1/me", 
                           headers={"Authorization": f"Bearer {token}"})
    user_data = user_res.json()
    email = user_data.get('email')
    
    # Sync to Supabase
    sync_user_data(email, user_data.get('id'))
    
    # Redirect to Next.js (Make sure this matches your frontend port, usually 3000)
    return redirect(f"http://localhost:3030/quiz?token={token}&email={email}")

# --- 3. CORE LOGIC ROUTES ---

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    email = data.get('email')
    token = data.get('token')
    
    ai_list = get_recommendations(data.get('answers'), data.get('language'))
    tracks = get_bulk_tracks(ai_list, token)
    
    save_generation(email, tracks)
    return jsonify(tracks)

@app.route('/export', methods=['POST'])
def export_playlist():
    try:
        data = request.json
        token = data.get('token')
        track_uris = data.get('track_uris')
        playlist_name = data.get('playlist_name', "Fabergé Vibe Selection")

        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        
        # Get User ID
        me = requests.get("https://api.spotify.com/v1/me", headers=headers).json()
        user_id = me['id']
        
        # Create Playlist
        playlist = requests.post(f"https://api.spotify.com/v1/users/{user_id}/playlists", 
                                headers=headers, 
                                json={"name": playlist_name, "description": "Curated by Fabergé AI", "public": False}).json()
        
        # Add Tracks
        requests.post(f"https://api.spotify.com/v1/playlists/{playlist['id']}/tracks", 
                     headers=headers, 
                     json={"uris": track_uris})
        
        return jsonify({"status": "success", "url": playlist['external_urls']['spotify']})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get-history', methods=['GET'])
def get_history():
    email = request.args.get('email')
    return jsonify(fetch_last_vibe(email))

if __name__ == '__main__':
    app.run(port=4040, debug=True)