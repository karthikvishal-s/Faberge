"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';

function ResultsContent() {
  const searchParams = useSearchParams();
  const [tracks, setTracks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  const token = searchParams.get('token');

  useEffect(() => {
    const getTracks = async () => {
      // 1. Pull answers from where they were saved in the previous step
      const savedAnswers = localStorage.getItem('quiz_answers');
      const answers = savedAnswers ? JSON.parse(savedAnswers) : {};
      
      console.log("🛠️ Debug: Token found:", token ? "Yes" : "No");
      console.log("🛠️ Debug: Answers found:", answers);

      if (!token) {
        setError("Missing Spotify Token. Please go back and login.");
        setLoading(false);
        return;
      }

      try {
        // 2. Call your Flask Backend
        const response = await axios.post("http://localhost:4040/generate", {
          token: token,
          answers: answers
        });

        console.log("✅ Success: Tracks received from Flask!");
        setTracks(response.data);
      } catch (err) {
        console.error("❌ API Error:", err);
        setError("Backend is not responding. Is Flask running on port 4040?");
      } finally {
        setLoading(false);
      }
    };

    getTracks();
  }, [token]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const trackUris = tracks.map(t => t.uri);
      const res = await axios.post("http://localhost:4040/export", {
        token: token,
        track_uris: trackUris
      });
      if (res.data.status === "success") {
        alert("Playlist created! Check your Spotify app.");
        window.open(res.data.url, "_blank");
      }
    } catch (err) {
      alert("Failed to sync playlist.");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p>Fetching your frequency...</p>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-black text-red-500">
      <p>{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-6xl font-black text-green-500 tracking-tighter">YOUR VIBE</h1>
            <p className="text-gray-400 mt-2">Curated for your current frequency.</p>
          </div>
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="bg-green-500 text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform disabled:opacity-50"
          >
            {syncing ? "SYNCING..." : "Sync to Spotify"}
          </button>
        </div>

        <div className="grid gap-4">
          {tracks?.map((track, i) => (
            <div key={track.id} className="group flex items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 hover:border-green-500/50 transition-colors">
              <img 
                src={track.album_art || "https://via.placeholder.com/150"} 
                className="w-16 h-16 rounded-lg shadow-lg" 
                alt="cover"
              />
              <div className="ml-6 flex-1">
                <h3 className="text-xl font-bold group-hover:text-green-400 transition-colors">{track.name}</h3>
                <p className="text-zinc-500">{track.artist}</p>
              </div>
              <span className="text-zinc-700 font-mono text-2xl">#{i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Next.js requires Suspense for useSearchParams
export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResultsContent />
    </Suspense>
  );
}