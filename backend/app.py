import os
import requests
import google.generativeai as genai
import json
from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
from spotipy.oauth2 import SpotifyOAuth
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor

load_dotenv()

app = Flask(__name__)
CORS(app)

# Setup Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

# Spotify Auth
sp_oauth = SpotifyOAuth(
    client_id=os.getenv("SPOTIPY_CLIENT_ID"),
    client_secret=os.getenv("SPOTIPY_CLIENT_SECRET"),
    redirect_uri=os.getenv("SPOTIPY_REDIRECT_URI"),
    scope="playlist-modify-public user-top-read"
)

def search_spotify_track(item, token):
    """Helper function to search for a single track"""
    headers = {"Authorization": f"Bearer {token}"}
    query = f"track:{item['track']} artist:{item['artist']}"
    url = "https://api.spotify.com/v1/search"
    
    try:
        res = requests.get(url, headers=headers, params={"q": query, "type": "track", "limit": 1})
        data = res.json()
        if data['tracks']['items']:
            t = data['tracks']['items'][0]
            return {
                "id": t['id'],
                "name": t['name'],
                "artist": t['artists'][0]['name'],
                "album_art": t['album']['images'][0]['url'] if t['album']['images'] else None,
                "uri": t['uri']
            }
    except:
        return None
    return None

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    token = data.get('token')
    answers = data.get('answers')

    # 1. Ask Gemini for 15 songs based on the quiz answers
    prompt = f"""
    Acting as a music expert, suggest 15 songs based on these quiz answers: {json.dumps(answers)}.
    Return ONLY a JSON array of objects with 'artist' and 'track' keys.
    Example: [{"artist": "Daft Punk", "track": "One More Time"}]
    Keep it high quality and ensure they are available on Spotify.
    """
    
    try:
        response = model.generate_content(prompt)
        # Clean the response string to ensure it's pure JSON
        raw_text = response.text.replace("```json", "").replace("```", "").strip()
        ai_recommendations = json.loads(raw_text)

        # 2. Use Parallel Searching to find all 15 songs quickly
        tracks = []
        with ThreadPoolExecutor(max_workers=10) as executor:
            results = list(executor.map(lambda item: search_spotify_track(item, token), ai_recommendations))
        
        # Filter out any failed searches
        tracks = [r for r in results if r is not None]
        
        return jsonify(tracks)

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

# Include your existing /login, /callback, and /export routes here...

if __name__ == '__main__':
    app.run(port=4040, debug=True)