export default function QuickControls({ brightness, contrast, saturation, volume, startTime, endTime, duration, video, onBrightness, onContrast, onSaturation, onVolume, onStartTime, onEndTime }) {
  return (
    <div className="space-y-1.5">
      {/* Brightness */}
      <div className="space-y-1 bg-blue-950/20 rounded-lg p-2 border border-blue-900/30">
        <label className="text-xs font-semibold text-cyan-300 block">☀️ Brightness</label>
        <div className="flex items-center gap-2">
          <input type="range" min="50" max="150" value={brightness} onChange={(e) => onBrightness(parseFloat(e.target.value))} className="flex-1 h-1.5 rounded-full" />
          <span className="text-xs font-bold text-cyan-400 w-8 text-right">{brightness}%</span>
        </div>
      </div>

      {/* Contrast */}
      <div className="space-y-1 bg-purple-950/20 rounded-lg p-2 border border-purple-900/30">
        <label className="text-xs font-semibold text-purple-300 block">🎯 Contrast</label>
        <div className="flex items-center gap-2">
          <input type="range" min="50" max="150" value={contrast} onChange={(e) => onContrast(parseFloat(e.target.value))} className="flex-1 h-1.5 rounded-full" />
          <span className="text-xs font-bold text-purple-400 w-8 text-right">{contrast}%</span>
        </div>
      </div>

      {/* Saturation */}
      <div className="space-y-1 bg-pink-950/20 rounded-lg p-2 border border-pink-900/30">
        <label className="text-xs font-semibold text-pink-300 block">🎨 Saturation</label>
        <div className="flex items-center gap-2">
          <input type="range" min="0" max="200" value={saturation} onChange={(e) => onSaturation(parseFloat(e.target.value))} className="flex-1 h-1.5 rounded-full" />
          <span className="text-xs font-bold text-pink-400 w-8 text-right">{saturation}%</span>
        </div>
      </div>

      {/* Volume */}
      <div className="space-y-1 bg-green-950/20 rounded-lg p-2 border border-green-900/30">
        <label className="text-xs font-semibold text-green-300 block">🔊 Volume</label>
        <div className="flex items-center gap-2">
          <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => onVolume(parseFloat(e.target.value))} className="flex-1 h-1.5 rounded-full" />
          <span className="text-xs font-bold text-green-400 w-8 text-right">{(volume * 100).toFixed(0)}%</span>
        </div>
      </div>

      {video && (
        <>
          <div className="space-y-1 bg-orange-950/20 rounded-lg p-2 border border-orange-900/30">
            <label className="text-xs font-semibold text-orange-300 block">▶️ Start Time</label>
            <div className="flex items-center gap-2">
              <input type="range" min="0" max={duration} value={startTime} onChange={(e) => onStartTime(Math.min(parseFloat(e.target.value), endTime))} className="flex-1 h-1.5 rounded-full" />
              <span className="text-xs font-bold text-orange-400 w-12 text-right">{startTime.toFixed(2)}s</span>
            </div>
          </div>

          <div className="space-y-1 bg-red-950/20 rounded-lg p-2 border border-red-900/30">
            <label className="text-xs font-semibold text-red-300 block">⏹️ End Time</label>
            <div className="flex items-center gap-2">
              <input type="range" min="0" max={duration} value={endTime} onChange={(e) => onEndTime(Math.max(parseFloat(e.target.value), startTime))} className="flex-1 h-1.5 rounded-full" />
              <span className="text-xs font-bold text-red-400 w-12 text-right">{endTime.toFixed(2)}s</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}