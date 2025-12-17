export default function TrackCard({ track, index }) {
    return (
      <div className="group relative bg-zinc-900/40 border border-zinc-800 p-4 rounded-2xl hover:bg-zinc-800/60 hover:border-green-500/30 transition-all duration-300">
        <div className="relative aspect-square mb-4 overflow-hidden rounded-lg">
          <img 
            src={track.album_art || "https://via.placeholder.com/300?text=No+Cover"} 
            alt={track.name} 
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-mono text-zinc-400">
            #{String(index + 1).padStart(2, '0')}
          </div>
        </div>
        
        <div className="space-y-1">
          <h3 className="text-lg font-bold truncate group-hover:text-green-400 transition-colors">
            {track.name}
          </h3>
          <p className="text-zinc-500 truncate text-sm">
            {track.artist}
          </p>
        </div>
      </div>
    );
  }