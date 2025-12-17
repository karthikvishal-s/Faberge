import os
import requests
from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
from spotipy.oauth2 import SpotifyOAuth
from dotenv import load_dotenv
from logic import calculate_vibe, get_questions

load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app)

sp_oauth = SpotifyOAuth(
    client_id=os.getenv("SPOTIPY_CLIENT_ID"),
    client_secret=os.getenv("SPOTIPY_CLIENT_SECRET"),
    redirect_uri=os.getenv("SPOTIPY_REDIRECT_URI"),
    scope="playlist-modify-public user-top-read user-read-private"
)

@app.route('/login')
def login():
    return jsonify({"auth_url": sp_oauth.get_authorize_url()})

@app.route('/callback')
def callback():
    code = request.args.get('code')
    token_info = sp_oauth.get_access_token(code, as_dict=False)
    access_token = token_info['access_token'] if isinstance(token_info, dict) else token_info
    # Adjust port to 3000 if your Next.js is there
    return redirect(f"http://localhost:3030/quiz?token={access_token}")

@app.route('/questions', methods=['GET'])
def questions():
    return jsonify(get_questions())

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    token = data.get('token')
    answers = data.get('answers')
    vibe = calculate_vibe(answers)

    headers = {"Authorization": f"Bearer {token}"}

    try:
        # 1. Use SEARCH to find a "Seed Track" based on the user's vibe
        # We search for a popular genre term derived from the quiz
        energy = vibe.get('target_energy', 0.5)
        search_query = "genre:party" if energy > 0.7 else "genre:chill"
        
        search_res = requests.get(
            "https://api.spotify.com/v1/search", 
            headers=headers, 
            params={"q": search_query, "type": "track", "limit": 1}
        ).json()

        # Get the ID of the first track found
        seed_track_id = search_res['tracks']['items'][0]['id']

        # 2. Use that Track ID to get 15 RECOMMENDATIONS
        # We pass your quiz targets (energy, danceability) to filter the results
        rec_params = {
            "limit": 15,
            "seed_tracks": seed_track_id,
            "target_energy": vibe['target_energy'],
            "target_danceability": vibe['target_danceability'],
            "target_valence": vibe['target_valence']
        }

        rec_res = requests.get(
            "https://api.spotify.com/v1/recommendations", 
            headers=headers, 
            params=rec_params
        )
        
        # 3. If recommendations still 404s, we fall back to the Search results
        if rec_res.status_code != 200:
            print("Fallback: Recommendations blocked, using Search results instead.")
            final_tracks = search_res['tracks']['items']
        else:
            final_tracks = rec_res.json()['tracks']

        # Format for Frontend
        tracks = [{
            "id": t['id'],
            "name": t['name'],
            "artist": t['artists'][0]['name'],
            "album_art": t['album']['images'][0]['url'] if t['album']['images'] else None,
            "uri": t['uri']
        } for t in final_tracks]

        return jsonify(tracks)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/export', methods=['POST'])
def export_playlist():
    data = request.json
    token = data.get('token')
    track_uris = data.get('track_uris')

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    try:
        # 1. Get User ID
        user_id = requests.get("https://api.spotify.com/v1/me", headers=headers).json()['id']

        # 2. Create Playlist
        playlist_res = requests.post(
            f"https://api.spotify.com/v1/users/{user_id}/playlists",
            headers=headers,
            json={"name": "My VibeCheck AI Playlist", "public": False}
        ).json()
        
        # 3. Add Tracks
        requests.post(
            f"https://api.spotify.com/v1/playlists/{playlist_res['id']}/tracks",
            headers=headers,
            json={"uris": track_uris}
        )
        return jsonify({"status": "success", "url": playlist_res['external_urls']['spotify']})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=4040, debug=True)