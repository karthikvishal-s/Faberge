"use client";
import Image from "next/image";
import axios from "axios";

export default function Home() {
  const handleLogin = async () => {
    try {
      // Calls your Flask backend on Port 4040
      const response = await axios.get("http://localhost:4040/login");
      // Redirects user to Spotify Authorization page
      window.location.href = response.data.auth_url;
    } catch (error) {
      console.error("Login failed:", error);
      alert("Make sure your Flask server is running on port 4040!");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black font-sans selection:bg-green-500/30">
      <main className="flex h-screen w-full max-w-4xl flex-col items-center justify-center py-20 px-8 text-center sm:items-start sm:text-left">
        
        {/* Logo Section */}
        <div className="mb-12 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xl font-bold tracking-tighter text-white">VIBECHECK AI</span>
        </div>

        <div className="flex flex-col gap-8">
          <h1 className="text-6xl font-black leading-[1.1] tracking-tighter text-white sm:text-8xl">
            Music for your <br />
            <span className="text-green-500 italic">exact</span> mood.
          </h1>
          
          <p className="max-w-lg text-lg leading-relaxed text-zinc-400 sm:text-xl">
            Answer 10 progressive questions. Our AI analyzes your "Vibe Vector" 
            and builds a custom 1-hour playlist directly in your Spotify library.
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <button
            onClick={handleLogin}
            className="group flex h-14 items-center justify-center gap-3 rounded-full bg-green-500 px-10 text-lg font-bold text-black transition-all hover:scale-105 hover:bg-green-400 active:scale-95"
          >
            Connect Spotify
            <svg 
              className="h-5 w-5 transition-transform group-hover:translate-x-1" 
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>

          <a
            href="#how-it-works"
            className="flex h-14 items-center justify-center rounded-full border border-zinc-800 px-10 text-lg font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
          >
            How it works
          </a>
        </div>
      </main>
    </div>
  );
}