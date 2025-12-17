
# Fabergé

**Fabergé** is a professional full-stack music discovery engine. It uses Generative AI to translate abstract user "vibes"—captured through a psychological 10-question quiz—into high-fidelity, language-aware Spotify playlists.

## 🚀 Technical Highlights

* **AI Logic:** Orchestrates **Gemini 1.5/2.0 Flash** models with a custom-built rotation system to optimize API quotas and ensure daily availability.
* **Performance Optimization:** Utilizes Python **Multi-threading (`ThreadPoolExecutor`)** to perform concurrent Spotify metadata lookups, reducing response times by 80%.
* **Multi-Language Engine:** Features a localized experience supporting **7+ languages** (Hindi, Tamil, Telugu, Kannada, Bengali, etc.), directing the AI to prioritize regional music industries.
* **State Management:** Implemented frontend caching via `localStorage` to prevent redundant AI API calls and minimize latency on page reloads.

## 🛠️ Tech Stack

* **Frontend:** Next.js 14, Tailwind CSS, Axios.
* **Backend:** Flask (Python), Spotipy, Google Generative AI SDK.
* **Authentication:** Spotify OAuth 2.0 (Authorization Code Flow).
* **AI:** Google Gemini 1.5 Flash / 2.0 Flash.

## 📦 Core Features

* **The Vibe Quiz:** 10 psychological questions with 6 choices per question for deep sentiment mapping.
* **Customization:** Ability to rename playlists dynamically before exporting to Spotify.
* **SaaS-Ready Architecture:** Built-in model rotation that resets daily at 12:00 AM to manage free-tier limits.
* **Direct Sync:** One-click export to create private playlists directly in the user's Spotify library.

## 🔧 Installation

1. **Clone the repo**
2. **Setup Backend:**
```bash
cd backend
pip install -r requirements.txt
python app.py

```


3. **Setup Frontend:**
```bash
cd frontend
npm install
npm run dev

```



---

**Would you like me to help you write the "Challenges & Solutions" section to show recruiters how you debugged the Spotify API deprecation?**
