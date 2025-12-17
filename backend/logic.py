# backend/logic.py

def calculate_vibe(answers):
    # Default median scores
    vibe = {
        "target_energy": 0.5,
        "target_valence": 0.5,
        "target_danceability": 0.5,
        "target_acousticness": 0.5
    }
    
    # Example logic for mapping answers:
    # Q1: "How is your energy right now?" (Scale 1-5)
    if 'q1' in answers:
        vibe["target_energy"] = int(answers['q1']) / 5.0
        
    # Q2: "Are you feeling happy or reflective?" (1 = Sad/Reflective, 5 = Euphoric)
    if 'q2' in answers:
        vibe["target_valence"] = int(answers['q2']) / 5.0
        
    # Q3: "In a library or at a party?" (1 = Library, 5 = Party)
    if 'q3' in answers:
        vibe["target_danceability"] = int(answers['q3']) / 5.0
        vibe["target_acousticness"] = 1.0 - (int(answers['q3']) / 5.0)

    return vibe