"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Sparkles, Play, RefreshCw, CheckCircle } from 'lucide-react';

const COLORS = ['#1DB954', '#1ed760', '#1aa34a', '#14532d', '#052e16'];

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  const [data, setData] = useState({ tracks: [], summary: "", vibe_stats: [] });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [playlistName, setPlaylistName] = useState("Fabergé Selection");

  const fetchVibe = async (isReRoll = false) => {
    setLoading(true);
    try {
      if (!isReRoll) {
        const history = await axios.get(`http://localhost:4040/get-history?email=${email}`);
        if (history.data && history.data.tracks) {
          setData(history.data);
          setLoading(false);
          return;
        }
      }
      const answers = JSON.parse(localStorage.getItem('quiz_answers') || '{}');
      const language = localStorage.getItem('quiz_lang') || 'English';
      const res = await axios.post("http://localhost:4040/generate", { token, email, answers, language });
      setData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (email) fetchVibe(); }, [email]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await axios.post("http://localhost:4040/export", {
        token, 
        uris: data.tracks.map(t => t.uri), 
        name: playlistName
      });
      window.open(res.data.url, '_blank');
    } catch (e) { alert("Sync failed. Check permissions."); }
    finally { setSyncing(false); }
  };

  if (loading) return (
    <div className="bg-black min-h-screen flex flex-col items-center justify-center text-green-500 font-mono">
      <div className="w-12 h-12 border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-6" />
      <p className="animate-pulse tracking-[0.5em] text-xs uppercase">Deciphering Frequency...</p>
    </div>
  );

  return (
    <div className="bg-[#050505] min-h-screen text-white p-6 md:p-12 font-sans selection:bg-green-500">
      
      {/* VIBE DASHBOARD */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
        <div className="lg:col-span-2 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-12 flex flex-col justify-between backdrop-blur-xl">
          <Sparkles className="w-6 h-6 text-green-500 mb-6" />
          <h2 className="text-4xl md:text-7xl font-black italic tracking-tighter leading-[0.85] uppercase mb-8">
            {data.summary}
          </h2>
          <button onClick={() => fetchVibe(true)} className="w-fit flex items-center gap-2 px-8 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold tracking-widest uppercase hover:bg-white/10 transition-all">
            <RefreshCw className="w-3 h-3" /> Generate New Frequency
          </button>
        </div>

        <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl flex flex-col items-center">
            <h3 className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-4">Vibe Analysis</h3>
            <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={data.vibe_stats} innerRadius={65} outerRadius={85} paddingAngle={10} dataKey="value">
                            {data.vibe_stats.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#000', border: 'none', borderRadius: '12px', fontSize: '10px' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
                {data.vibe_stats.map((v, i) => (
                    <div key={i} className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-zinc-400">
                        <div className="w-1.5 h-1.5 rounded-full" style={{background: COLORS[i]}} /> {v.name}
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* TRACKLIST */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div className="w-full max-w-md">
                <p className="text-[10px] uppercase tracking-[0.5em] text-zinc-600 font-bold mb-4">Current Selection</p>
                <input 
                    value={playlistName} 
                    onChange={(e) => setPlaylistName(e.target.value)}
                    className="bg-transparent border-b border-white/10 w-full text-2xl font-bold italic outline-none focus:border-green-500 py-2"
                />
            </div>
            <button 
                onClick={handleSync} 
                disabled={syncing}
                className="bg-green-500 text-black px-12 py-4 rounded-full font-black text-xs tracking-widest uppercase hover:scale-105 transition-all flex items-center gap-2"
            >
                {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                {syncing ? "Syncing..." : "Sync to Spotify"}
            </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {data.tracks.map((track, i) => (
            <div key={track.id} className="group cursor-pointer">
                <div className="aspect-square w-full rounded-3xl overflow-hidden mb-4 bg-zinc-900 relative shadow-2xl transition-all group-hover:shadow-green-500/10">
                    <img src={track.album_art} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={track.name} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-8 h-8 text-green-500 fill-current" />
                    </div>
                </div>
                <h4 className="text-[11px] font-bold uppercase tracking-tight truncate">{track.name}</h4>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1 truncate">{track.artist}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Page() { return <Suspense><ResultsContent /></Suspense>; }