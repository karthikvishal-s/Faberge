import os
import json
import google.generativeai as genai
from datetime import datetime

def get_recommendations(answers, lang):
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    
    # Simple rotation logic
    models = ["gemini-1.5-flash", "gemini-1.5-pro"]
    # For now, we pick the first one; you can add counter logic here
    model = genai.GenerativeModel(f"models/{models[0]}")
    
    prompt = f"Recommend 15 real songs based on: {json.dumps(answers)}. Language: {lang}. Return ONLY a JSON array of objects with 'artist' and 'track'."
    
    response = model.generate_content(prompt)
    return json.loads(response.text.replace("```json", "").replace("```", "").strip())