from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
from spotipy.oauth2 import SpotifyOAuth
import requests
from services.ai_service import get_recommendations
from services.spotify_service import get_bulk_tracks
from services.db_service import sync_user, update_user_vibe, get_last_vibe
import os

app = Flask(__name__)
CORS(app)

sp_oauth = SpotifyOAuth(
    client_id=os.getenv("SPOTIPY_CLIENT_ID"),
    client_secret=os.getenv("SPOTIPY_CLIENT_SECRET"),
    redirect_uri=os.getenv("SPOTIPY_REDIRECT_URI"),
    scope="playlist-modify-public user-top-read user-read-private user-read-email"
)

@app.route('/callback')
def callback():
    code = request.args.get('code')
    token = sp_oauth.get_access_token(code, as_dict=False)
    
    # Get user email for DB
    user_info = requests.get("https://api.spotify.com/v1/me", headers={"Authorization": f"Bearer {token}"}).json()
    email = user_info.get('email')
    
    sync_user(email, user_info.get('id'))
    return redirect(f"http://localhost:3030/quiz?token={token}&email={email}")

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    token, answers, email = data.get('token'), data.get('answers'), data.get('email')
    lang = data.get('language', 'en')

    # 1. AI Logic
    ai_list = get_recommendations(answers, lang)
    # 2. Spotify Logic
    tracks = get_bulk_tracks(ai_list, token)
    # 3. DB Logic
    update_user_vibe(email, tracks)
    
    return jsonify(tracks)

@app.route('/last-vibe', methods=['GET'])
def last_vibe():
    email = request.args.get('email')
    return jsonify(get_last_vibe(email))

if __name__ == '__main__':
    app.run(port=4040, debug=True)