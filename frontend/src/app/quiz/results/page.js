"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import TrackCard from '@/components/TrackCard'; // We will create this next

function ResultsContent() {
  const searchParams = useSearchParams();
  const [tracks, setTracks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  const token = searchParams.get('token');

  useEffect(() => {
    const generatePlaylist = async () => {
      const savedAnswers = localStorage.getItem('quiz_answers');
      const answers = savedAnswers ? JSON.parse(savedAnswers) : {};

      if (!token) {
        setError("Missing Spotify access token. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        // Calling your Flask backend on port 4040
        const response = await axios.post("http://localhost:4040/generate", {
          token: token,
          answers: answers
        });
        setTracks(response.data);
      } catch (err) {
        console.error("API Error:", err);
        setError("The vibe engine is currently offline. Please check your backend.");
      } finally {
        setLoading(false);
      }
    };

    generatePlaylist();
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
        alert("Playlist successfully created in your Spotify account!");
        window.open(res.data.url, "_blank");
      }
    } catch (err) {
      alert("Failed to sync playlist to Spotify.");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-end mb-10 border-b border-zinc-800 pb-8">
          <div>
            <h1 className="text-7xl font-black text-green-500 tracking-tighter italic">YOUR VIBE</h1>
            <p className="text-zinc-400 mt-2 text-lg">AI-curated selection based on your frequency.</p>
          </div>
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="bg-green-500 text-black px-10 py-4 rounded-full font-bold hover:scale-105 transition-all disabled:opacity-50"
          >
            {syncing ? "SYNCING..." : "SYNC TO SPOTIFY"}
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tracks?.map((track, i) => (
            <TrackCard key={track.id} track={track} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Reusable UI States
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
    <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-xl font-medium tracking-widest animate-pulse">ANALYZING FREQUENCY...</p>
  </div>
);

const ErrorState = ({ message }) => (
  <div className="flex items-center justify-center min-h-screen bg-black text-red-500 p-4 text-center">
    <p className="text-lg font-bold">ERROR: {message}</p>
  </div>
);

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ResultsContent />
    </Suspense>
  );
}