import os
import json
import google.generativeai as genai
from datetime import datetime

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model_tracker = {
    "models": ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-pro"],
    "current_index": 0,
    "count": 0,
    "last_reset": datetime.now().date()
}

def get_recommendations(answers, lang):
    global model_tracker
    # Daily Reset
    if datetime.now().date() > model_tracker["last_reset"]:
        model_tracker.update({"count": 0, "current_index": 0, "last_reset": datetime.now().date()})
    
    # Rotate
    if model_tracker["count"] >= 20:
        model_tracker["current_index"] = (model_tracker["current_index"] + 1) % len(model_tracker["models"])
        model_tracker["count"] = 0

    model_name = model_tracker["models"][model_tracker["current_index"]]
    model = genai.GenerativeModel(f"models/{model_name}")
    
    prompt = f"Recommend 15 real songs based on: {json.dumps(answers)}. Language: {lang}. Return ONLY a JSON array of objects with 'artist' and 'track'."
    
    response = model.generate_content(prompt)
    model_tracker["count"] += 1
    
    return json.loads(response.text.replace("```json", "").replace("```", "").strip())