"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';

function ResultsContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !email) return;

    const fetchVibe = async () => {
      try {
        // 1. Check History (Supabase)
        const history = await axios.get(`http://localhost:4040/get-history?email=${email}`);
        if (history.data && history.data.length > 0) {
          setTracks(history.data);
          setLoading(false);
          return;
        }

        // 2. If no history, Generate new
        const answers = JSON.parse(localStorage.getItem('quiz_answers') || '{}');
        const res = await axios.post("http://localhost:4040/generate", { 
          token, email, answers, language: 'en' 
        });
        setTracks(res.data);
      } catch (err) {
        console.error("Vibe Error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVibe();
  }, [token, email]);

  if (loading) return (
    <div className="bg-black min-h-screen flex flex-col items-center justify-center text-green-500">
      <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="font-mono italic animate-pulse">READING YOUR FREQUENCY...</p>
    </div>
  );

  return (
    <div className="bg-black min-h-screen p-10 text-white">
      <h1 className="text-4xl font-black italic mb-10">FABERGÉ SELECTION</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tracks.map((track) => (
          <div key={track.id} className="bg-zinc-900 p-4 rounded-lg flex items-center gap-4">
            <img src={track.album_art} className="w-16 h-16 rounded" alt="cover" />
            <div>
              <p className="font-bold line-clamp-1">{track.name}</p>
              <p className="text-zinc-400 text-sm">{track.artist}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Page() { return <Suspense><ResultsContent /></Suspense>; }