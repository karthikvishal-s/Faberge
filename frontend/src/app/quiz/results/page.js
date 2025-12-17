"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function Results() {
  const searchParams = useSearchParams();
  const [tracks, setTracks] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const token = searchParams.get('token');

  useEffect(() => {
    // In a real flow, you'd pass the actual answers here
    // For now, we're fetching the generated 15 tracks
    const savedAnswers = JSON.parse(localStorage.getItem('vibe_answers') || '{}');
    
    axios.post('http://localhost:4040/generate', {
      token: token,
      answers: savedAnswers
    }).then(res => setTracks(res.data));
  }, [token]);

  const exportToSpotify = async () => {
    setIsExporting(true);
    try {
      await axios.post('http://localhost:4040/export', { 
        token, 
        track_uris: tracks.map(t => t.uri) 
      });
      alert("Playlist created successfully on Spotify! 🚀");
    } catch (err) {
      alert("Export failed. Check console.");
    }
    setIsExporting(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tighter text-green-500">YOUR VIBE</h1>
            <p className="text-gray-400 mt-2">15 tracks curated for your current frequency.</p>
          </div>
          <button 
            onClick={exportToSpotify}
            disabled={isExporting}
            className="bg-green-600 hover:bg-green-500 text-black font-bold py-3 px-8 rounded-full transition-transform active:scale-95 disabled:opacity-50"
          >
            {isExporting ? "Syncing..." : "Sync to Spotify"}
          </button>
        </header>

        <div className="grid gap-4">
          {tracks.map((track, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={track.id}
              className="flex items-center p-4 bg-gray-900/50 hover:bg-gray-800 rounded-xl group transition-colors"
            >
              <img src={track.album_art} className="w-16 h-16 rounded shadow-lg mr-6" alt={track.name} />
              <div className="flex-1">
                <h3 className="font-bold text-lg group-hover:text-green-400 transition-colors">{track.name}</h3>
                <p className="text-gray-400">{track.artist}</p>
              </div>
              <div className="text-gray-600 font-mono text-sm">#{(index + 1).toString().padStart(2, '0')}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}