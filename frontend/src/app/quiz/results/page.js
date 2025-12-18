"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';

function ResultsContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [tracks, setTracks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [playlistName, setPlaylistName] = useState("My VibeCheck AI Playlist");

  useEffect(() => {
    const email = searchParams.get('email');
    
    const loadContent = async () => {
      // Attempt to load previous vibe from DB first
      try {
        const history = await axios.get(`http://localhost:4040/get-history?email=${email}`);
        if (history.data) {
          setTracks(history.data);
          setLoading(false);
          return;
        }
        // If no history, proceed to generate new vibe...
      } catch (e) { console.error("History fetch failed"); }
    };
    
    if (email && !tracks) loadContent();
  }, [token, tracks]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await axios.post("http://localhost:4040/export", {
        token,
        track_uris: tracks.map(t => t.uri),
        playlist_name: playlistName
      });
      if (res.data.status === "success") window.open(res.data.url, "_blank");
    } catch (err) { alert("Sync failed"); }
    finally { setSyncing(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="animate-pulse tracking-widest uppercase">Reading your frequency...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-6xl font-black text-green-500 mb-10 italic tracking-tighter">THE RESULT</h1>
        
        <div className="flex flex-col md:flex-row gap-4 mb-12 bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
          <input 
            className="flex-1 bg-black border border-zinc-700 p-4 rounded-2xl outline-none focus:border-green-500"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
          />
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="bg-green-500 text-black font-black px-10 py-4 rounded-2xl hover:bg-green-400 transition-colors disabled:opacity-50"
          >
            {syncing ? "SYNCING..." : "SYNC TO SPOTIFY"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {tracks?.map((track, i) => (
            <div key={track.id} className="flex items-center bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors">
              <img src={track.album_art} className="w-16 h-16 rounded-xl shadow-lg mr-6" />
              <div className="flex-1">
                <p className="font-bold text-lg">{track.name}</p>
                <p className="text-zinc-500">{track.artist}</p>
              </div>
              <span className="text-zinc-800 font-black text-2xl">#{i+1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Page() { return <Suspense><ResultsContent /></Suspense>; }