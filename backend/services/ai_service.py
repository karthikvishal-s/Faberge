import os
import json
import google.genai as genai  # Changed this line
from datetime import datetime

def get_recommendations(answers, lang):
    # Initialize the client
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    
    system_message = (
        "You are a music recommendation engine. Output ONLY valid JSON. "
        "Format: [{\"artist\": \"Name\", \"track\": \"Name\"}, ...]"
    )

    prompt = f"Based on these vibe answers: {json.dumps(answers)}, recommend 15 real songs. Language: {lang}."

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "system_instruction": system_message,
                "response_mime_type": "application/json"
            }
        )
        
        # Parse the JSON response
        return json.loads(response.text.strip())

    except Exception as e:
        print(f"❌ [AI ERROR]: {e}")
        # Fallback list to prevent 500 errors
        return [{"artist": "The Weeknd", "track": "Blinding Lights"}]