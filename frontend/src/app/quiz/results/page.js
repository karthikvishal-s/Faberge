"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Sparkles, Music, Play, Download, RefreshCw } from 'lucide-react';

const COLORS = ['#1DB954', '#1ed760', '#1aa34a', '#14532d', '#052e16'];

function ResultsContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const [data, setData] = useState({ tracks: [], summary: "", vibe_stats: [] });
  const [loading, setLoading] = useState(true);

  const fetchVibe = async (isReRoll = false) => {
    setLoading(true);
    try {
      if (!isReRoll) {
        const history = await axios.get(`http://localhost:4040/get-history?email=${email}`);
        if (history.data) { setData(history.data); setLoading(false); return; }
      }
      const answers = JSON.parse(localStorage.getItem('quiz_answers') || '{}');
      const language = localStorage.getItem('quiz_lang') || 'English';
      const res = await axios.post("http://localhost:4040/generate", { token, email, answers, language });
      setData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (email) fetchVibe(); }, [email]);

  if (loading) return (
    <div className="bg-black min-h-screen flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 border-t-2 border-green-500 rounded-full animate-spin" />
      <p className="text-zinc-500 font-mono tracking-[0.8em] text-[10px] uppercase animate-pulse">Analyzing Frequency</p>
    </div>
  );

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white p-6 md:p-12 font-sans selection:bg-green-500">
      
      {/* TOP DASHBOARD: SUMMARY & CHART */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        
        {/* Poetic Summary Card */}
        <div className="lg:col-span-2 bg-zinc-900/40 border border-white/5 rounded-[2rem] p-10 flex flex-col justify-between backdrop-blur-xl">
          <div className="flex items-center gap-2 text-zinc-500 mb-8">
            <Sparkles className="w-4 h-4 text-green-500" />
            <span className="text-[10px] uppercase tracking-[0.3em]">Sonic Profile Analysis</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter leading-[0.9] uppercase">
            {data.summary}
          </h2>
          <div className="mt-12 flex gap-4">
            <button onClick={() => fetchVibe(true)} className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold tracking-widest uppercase hover:bg-white/10 transition-all">
              <RefreshCw className="w-3 h-3" /> Re-calibrate
            </button>
          </div>
        </div>

        {/* Analytics Card */}
        <div className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-8 backdrop-blur-xl relative flex flex-col items-center justify-center">
            <h3 className="absolute top-8 left-8 text-[10px] uppercase tracking-[0.3em] text-zinc-500">Vibe Metrics</h3>
            <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={data.vibe_stats} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                            {data.vibe_stats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#000', border: 'none', borderRadius: '12px' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                {data.vibe_stats.map((v, i) => (
                    <div key={i} className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-zinc-400">
                        <div className="w-1.5 h-1.5 rounded-full" style={{background: COLORS[i]}} /> {v.name}
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* TRACK GRID */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
            <h3 className="text-[11px] uppercase tracking-[0.5em] text-zinc-600 font-bold">Generated Selection // 15 Tracks</h3>
            <button className="bg-green-500 text-black px-8 py-3 rounded-full font-black text-[10px] tracking-[0.2em] uppercase hover:scale-105 transition-transform">
                Sync to Spotify
            </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {data.tracks.map((track, i) => (
            <div key={track.id} className="group relative">
                {/* Album Art Container */}
                <div className="aspect-square w-full rounded-2xl overflow-hidden mb-4 bg-zinc-900 relative shadow-2xl">
                    <img 
                        src={track.album_art} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        alt={track.name} 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-black shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform">
                            <Play className="w-6 h-6 fill-current" />
                        </div>
                    </div>
                    <span className="absolute top-4 left-4 text-[10px] font-mono bg-black/60 backdrop-blur-md px-2 py-1 rounded text-white/50">
                        {String(i + 1).padStart(2, '0')}
                    </span>
                </div>
                {/* Text Info */}
                <h4 className="text-xs font-bold uppercase tracking-tight truncate group-hover:text-green-500 transition-colors">
                    {track.name}
                </h4>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 truncate">
                    {track.artist}
                </p>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/5 flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
        <p className="text-[9px] uppercase tracking-widest text-zinc-500">© 2025 Fabergé AI // All rights reserved.</p>
        <button onClick={() => router.push('/')} className="text-[9px] uppercase tracking-widest font-bold hover:text-green-500 transition-colors">
            End Session
        </button>
      </div>
    </div>
  );
}

export default function Page() { return <Suspense><ResultsContent /></Suspense>; }