from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
from spotipy.oauth2 import SpotifyOAuth
import requests
import os
import time
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

@app.route('/questions')
def questions():
    return jsonify([
        {"id": "q1", "text": "What's the primary genre you're looking for?", "options": ["Rock", "Pop", "Jazz/Blues", "Classical", "Hip-Hop", "Electronic/Dance"]},
        {"id": "q2", "text": "Which era should define the sound?", "options": ["60s-70s Classics", "80s-90s Nostalgia", "2000s-2010s", "Modern Day", "A Mix of Eras", "Futuristic"]},
        {"id": "q3", "text": "What is your current mood?", "options": ["Happy & Upbeat", "Relaxed & Calm", "Melancholic/Sad", "Focused/Productive", "Aggressive/Hype", "Romantic"]},
        {"id": "q4", "text": "How much discovery do you want?", "options": ["Mainstream Hits", "Underrated Gems", "Complete Unknowns", "A Balanced Mix", "Classic Anthems", "Trending Now"]},
        {"id": "q5", "text": "What is the setting?", "options": ["Morning Coffee", "Gym Workout", "Late Night Drive", "Office/Study", "Party/Social", "Rainy Day"]},
        {"id": "q6", "text": "What should this playlist do for you?", "options": ["Energize me", "Help me relax", "Make me think", "Keep me company", "Evoke nostalgia", "Motivate me"]},
        {"id": "q7", "text": "What energy level do you need?", "options": ["Acoustic/Soft", "Mid-tempo/Groovy", "High Energy", "Maximum Intensity"]},
        {"id": "q8", "text": "Select your sonic texture:", "options": ["Vintage & Warm", "Clean & Modern", "Raw & Gritty", "Electronic & Synthetic"]},
        {"id": "q9", "text": "Vocals or Instrumental?", "options": ["Mostly Vocals", "Mostly Instrumental", "A Healthy Mix", "Spoken Word/Lofi"]},
        {"id": "q10", "text": "Main character moment?", "options": ["Walking in slow-mo", "Thinking by a window", "Center of a dancefloor", "Exploring a new city"]}
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
    lang = data.get('language', 'English')

    # 1. Get the full AI response (summary, stats, and tracks)
    ai_response = get_recommendations(data.get('answers'), lang)
    
    # 2. Extract the track list for Spotify searching
    ai_track_list = ai_response.get('tracks', [])
    
    # 3. Search Spotify for metadata
    spotify_tracks = get_bulk_tracks(ai_track_list, token)
    
    # 4. Attach the enriched Spotify data back to the original response
    full_payload = {
        "summary": ai_response.get('summary'),
        "vibe_stats": ai_response.get('vibe_stats'),
        "tracks": spotify_tracks  # Now with album art and URIs
    }
    
    # 5. Save to DB
    save_generation(email, full_payload)
    
    return jsonify(full_payload)
@app.route('/export', methods=['POST'])
def export():
    data = request.json
    token, uris, name = data.get('token'), data.get('uris'), data.get('name')
    headers = {"Authorization": f"Bearer {token}"}
    user = requests.get("https://api.spotify.com/v1/me", headers=headers).json()
    playlist = requests.post(f"https://api.spotify.com/v1/users/{user['id']}/playlists", 
                             headers=headers, json={"name": name, "public": False}).json()
    requests.post(f"https://api.spotify.com/v1/playlists/{playlist['id']}/tracks", 
                  headers=headers, json={"uris": uris})
    return jsonify({"url": playlist['external_urls']['spotify']})
@app.route('/get-history', methods=['GET'])
def get_history():
    email = request.args.get('email')
    return jsonify(fetch_last_vibe(email))

if __name__ == '__main__':
    app.run(port=4040, debug=True)