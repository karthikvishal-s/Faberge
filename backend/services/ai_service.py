import os
import json
import google.genai as genai

def get_recommendations(answers, lang):
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    
    # Constructing the Narrative Paragraph for Gemini
    vibe_p = (
        f"The user wants a {answers.get('genre')} sound from the {answers.get('era')}. "
        f"They are in a {answers.get('mood')} mood, listening during {answers.get('setting')}. "
        f"They want {answers.get('discovery')} and the language must be {lang}."
    )

    system_msg = "You are Fabergé, an elite curator. Analyze vibe paragraphs and return ONLY valid JSON."

    prompt = f"""
    ANALYSIS: {vibe_p}
    
    TASK: Return a 15-track playlist in JSON:
    {{
      "summary": "A 1-sentence poetic summary.",
      "vibe_stats": [{{"name": "Nostalgia", "value": 25}}, ...],
      "tracks": [{{"artist": "Name", "track": "Title"}}, ...]
    }}
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={"system_instruction": system_msg, "response_mime_type": "application/json"}
        )
        return json.loads(response.text.strip())
    except Exception as e:
        print(f"❌ AI Error: {e}")
        return None # Handled by the check in app.py