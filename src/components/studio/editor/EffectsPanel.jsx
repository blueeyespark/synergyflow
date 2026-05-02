const transitions = [
  { id: "fade", name: "Fade", duration: 0.5 },
  { id: "dissolve", name: "Dissolve", duration: 0.5 },
  { id: "slide", name: "Slide", duration: 0.5 },
  { id: "wipe", name: "Wipe", duration: 0.5 },
  { id: "zoom", name: "Zoom", duration: 0.5 },
  { id: "cross-fade", name: "Cross Fade", duration: 0.5 },
];

const filterPresets = [
  { id: "none", name: "None", filters: {} },
  { id: "vintage", name: "Vintage", filters: { sepia: 30, saturation: 0.8 } },
  { id: "noir", name: "B&W", filters: { grayscale: 100, contrast: 1.2 } },
  { id: "cool", name: "Cool", filters: { hue: -10, saturation: 1.1 } },
  { id: "warm", name: "Warm", filters: { hue: 20, saturation: 1.1 } },
  { id: "vibrant", name: "Vibrant", filters: { saturation: 1.4, contrast: 1.1 } },
];

export default function EffectsPanel({ selectedTransition, selectedFilter, onTransitionChange, onFilterChange }) {
  return (
    <>
      <div>
        <p className="text-xs font-semibold text-blue-300 mb-1.5">Transitions</p>
        <div className="grid grid-cols-2 gap-1.5">
          {transitions.map(t => (
            <button
              key={t.id}
              onClick={() => onTransitionChange(t.id)}
              className={`p-1.5 rounded text-xs font-medium transition-all ${
                selectedTransition === t.id ? "bg-cyan-600 text-white" : "bg-[#050a14] text-blue-400/60 border border-blue-900/40 hover:border-blue-600/40"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-blue-300 mb-1.5">Filters</p>
        <div className="grid grid-cols-2 gap-1.5">
          {filterPresets.map(f => (
            <button
              key={f.id}
              onClick={() => onFilterChange(f.id)}
              className={`p-1.5 rounded text-xs font-medium transition-all ${
                selectedFilter === f.id ? "bg-purple-600 text-white" : "bg-[#050a14] text-blue-400/60 border border-blue-900/40 hover:border-blue-600/40"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}