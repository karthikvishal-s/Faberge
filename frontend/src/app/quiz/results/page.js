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
    const initResults = async () => {
      // 1. Check Caching: Don't re-generate if we already have tracks in storage
      const cached = localStorage.getItem('vibe_cache');
      if (cached) {
        setTracks(JSON.parse(cached));
        setLoading(false);
        return;
      }

      const answers = JSON.parse(localStorage.getItem('quiz_answers') || '{}');
      try {
        const res = await axios.post("http://localhost:4040/generate", { token, answers });
        setTracks(res.data);
        localStorage.setItem('vibe_cache', JSON.stringify(res.data)); // Store cache
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };

    if (token) initResults();
  }, [token]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await axios.post("http://localhost:4040/export", {
        token,
        track_uris: tracks.map(t => t.uri),
        playlist_name: playlistName // Sending custom name!
      });
      if (res.data.status === "success") window.open(res.data.url, "_blank");
    } catch (err) { alert("Sync failed"); }
    finally { setSyncing(false); }
  };

  const handleRegenerate = () => {
    localStorage.removeItem('vibe_cache'); // Clear cache
    window.location.reload(); // Refresh to trigger new call
  };

  if (loading) return <div className="p-20 text-white">Generating your unique vibe...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-green-500 mb-8">YOUR VIBE</h1>
        
        {/* Rename Input Section */}
        <div className="bg-zinc-900 p-6 rounded-xl mb-10 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="text-xs text-zinc-500 uppercase font-bold mb-2 block">Playlist Name</label>
            <input 
              type="text" 
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="w-full bg-black border border-zinc-700 p-3 rounded text-white focus:border-green-500 outline-none"
            />
          </div>
          <button onClick={handleSync} disabled={syncing} className="bg-green-500 text-black font-bold px-8 py-3 rounded-full hover:bg-green-400">
            {syncing ? "SYNCING..." : "SYNC TO SPOTIFY"}
          </button>
          <button onClick={handleRegenerate} className="text-zinc-500 text-sm hover:text-white underline pb-3">
            New Vibe
          </button>
        </div>

        {/* Track List */}
        <div className="space-y-4">
          {tracks?.map((track) => (
            <div key={track.id} className="flex items-center bg-zinc-900/40 p-4 rounded-lg">
              <img src={track.album_art} className="w-12 h-12 rounded mr-4" alt="art" />
              <div>
                <p className="font-bold">{track.name}</p>
                <p className="text-zinc-500 text-sm">{track.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Page() { return <Suspense><ResultsContent /></Suspense>; }