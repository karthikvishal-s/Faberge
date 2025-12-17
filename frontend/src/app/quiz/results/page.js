"use client"

import React, { useState } from 'react';
import axios from 'axios';

export default function Results({ tracks, token }) {
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    if (!tracks || tracks.length === 0) return;
    
    setLoading(true);
    const trackUris = tracks.map(t => t.uri);

    try {
      const response = await axios.post("http://localhost:4040/export", {
        token: token,
        track_uris: trackUris
      });

      if (response.data.status === "success") {
        alert("Playlist synced to your Spotify!");
        window.open(response.data.url, "_blank");
      }
    } catch (err) {
      console.error("Sync error:", err);
      alert("Failed to sync playlist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-black text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-green-500">YOUR VIBE</h1>
        <button 
          onClick={handleSync}
          disabled={loading}
          className="bg-green-500 text-black px-6 py-2 rounded-full font-bold hover:bg-green-400 transition"
        >
          {loading ? "Syncing..." : "Sync to Spotify"}
        </button>
      </div>

      <div className="space-y-4">
        {tracks.map((track, index) => (
          <div key={track.id} className="flex items-center bg-gray-900 p-4 rounded-lg border border-gray-800">
            <img 
              src={track.album_art || "/placeholder.png"} 
              alt={track.name} 
              className="w-16 h-16 rounded mr-4"
            />
            <div className="flex-1">
              <h3 className="font-bold">{track.name}</h3>
              <p className="text-gray-400">{track.artist}</p>
            </div>
            <span className="text-gray-600 font-mono">#{String(index + 1).padStart(2, '0')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}