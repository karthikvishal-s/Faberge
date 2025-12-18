import os
import json
import google.genai as genai

def get_recommendations(answers, lang):
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    
    system_instruction = (
       f"""You are Fabergé, a luxury music psychologist.give me 15 songs in {lang} language available in spotify. Output ONLY valid JSON. """
        "Analyze the user's soul and return a 3-part response: tracks, a poetic 1-sentence summary, "
        "and vibe_stats (4-5 categories with percentages for a pie chart)."
    )

    prompt = f"""
    USER ANSWERS: {json.dumps(answers)}
    LANGUAGE: {lang}

    RETURN FORMAT (Strict JSON):
    {{
      "summary": "One sentence describing the psychological musical profile.",
      "vibe_stats": [
        {{"name": "Nostalgia", "value": 30}},
        {{"name": "Energy", "value": 20}},
        ...
      ],
      "tracks": [
        {{"artist": "Name", "track": "Title"}},
        ...
      ]
    }}
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt,
            config={
                "system_instruction": system_instruction,
                "response_mime_type": "application/json"
            }
        )
        return json.loads(response.text.strip())
    except Exception as e:
        print(f"❌ AI Error: {e}")
        return {"summary": "A balanced selection for your mood.", "vibe_stats": [], "tracks": []}