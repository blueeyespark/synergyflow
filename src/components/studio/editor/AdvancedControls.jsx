export default function AdvancedControls({ hue, blur, opacity, rotation, speed, onHue, onBlur, onOpacity, onRotation, onSpeed }) {
  return (
    <div className="space-y-3">
      {/* Advanced Color & Transform */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400">🎨 Advanced Color</h4>
        <div className="space-y-1.5 bg-orange-950/20 rounded-lg p-2 border border-orange-900/30">
          <div>
            <label className="text-xs font-semibold text-orange-300 block mb-1">Hue: {hue}°</label>
            <input type="range" min="-180" max="180" value={hue} onChange={(e) => onHue(parseFloat(e.target.value))} className="w-full h-1.5 rounded-full" />
          </div>
          <div>
            <label className="text-xs font-semibold text-orange-300 block mb-1">Blur: {blur}px</label>
            <input type="range" min="0" max="20" value={blur} onChange={(e) => onBlur(parseFloat(e.target.value))} className="w-full h-1.5 rounded-full" />
          </div>
          <div>
            <label className="text-xs font-semibold text-orange-300 block mb-1">Opacity: {opacity}%</label>
            <input type="range" min="0" max="100" value={opacity} onChange={(e) => onOpacity(parseFloat(e.target.value))} className="w-full h-1.5 rounded-full" />
          </div>
        </div>
      </div>

      {/* Transform Controls */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-400">🔄 Transform</h4>
        <div className="space-y-1.5 bg-yellow-950/20 rounded-lg p-2 border border-yellow-900/30">
          <div>
            <label className="text-xs font-semibold text-yellow-300 block mb-1">Rotation: {rotation}°</label>
            <input type="range" min="-180" max="180" value={rotation} onChange={(e) => onRotation(parseFloat(e.target.value))} className="w-full h-1.5 rounded-full" />
          </div>
          <div>
            <label className="text-xs font-semibold text-yellow-300 block mb-1">Playback Speed: {Math.abs(speed).toFixed(1)}x</label>
            <input type="range" min="-2" max="2" step="0.1" value={speed} onChange={(e) => onSpeed(parseFloat(e.target.value))} className="w-full h-1.5 rounded-full" />
            <p className="text-xs text-yellow-400/60 mt-0.5">Negative = reverse</p>
          </div>
        </div>
      </div>
    </div>
  );
}