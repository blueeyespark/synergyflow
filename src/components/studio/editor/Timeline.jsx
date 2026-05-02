export default function Timeline({ video, currentTime, duration, onSeek, videoRef }) {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!video) return null;

  return (
    <div className="h-24 border-t border-blue-900/50 bg-gradient-to-b from-[#0a0e27] to-[#050a14] p-3 space-y-2 overflow-x-auto">
      <div className="flex justify-between text-xs font-semibold text-cyan-400/80">
        <span>{currentTime.toFixed(2)}s</span>
        <span className="text-blue-400/60">{duration.toFixed(2)}s</span>
      </div>
      <div className="relative h-2 bg-gradient-to-r from-blue-950 to-purple-950 rounded-full cursor-pointer shadow-inner">
        <div className="absolute h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full shadow-lg shadow-cyan-500/40" style={{ width: `${progressPercent}%` }} />
        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value), videoRef)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
      <div className="h-10 bg-gradient-to-b from-blue-950/30 to-purple-950/30 rounded border border-blue-900/50 flex items-end justify-around p-0.5 gap-0.5 shadow-inner">
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-gradient-to-t from-cyan-400/70 via-blue-500/50 to-purple-600/30 rounded-t transition-all"
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
      </div>
    </div>
  );
}