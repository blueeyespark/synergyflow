import { useState, useMemo } from "react";
import { Search, ChevronDown, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";

const settingCategories = [
  {
    id: "playback",
    name: "Playback",
    icon: "▶️",
    settings: [
      { id: "speed", label: "Speed", type: "range", min: 0.25, max: 2, step: 0.25, default: 1, suffix: "x" },
      { id: "playback-quality", label: "Quality", type: "select", options: ["360p", "480p", "720p", "1080p", "4K"], default: "720p" },
    ]
  },
  {
    id: "visual",
    name: "Visual Effects",
    icon: "🎨",
    settings: [
      { id: "rotation", label: "Rotation", type: "range", min: -180, max: 180, step: 1, default: 0, suffix: "°" },
      { id: "opacity", label: "Opacity", type: "range", min: 0, max: 100, step: 1, default: 100, suffix: "%" },
      { id: "blur", label: "Blur", type: "range", min: 0, max: 20, step: 0.5, default: 0, suffix: "px" },
      { id: "sharpen", label: "Sharpen", type: "range", min: 0, max: 100, step: 5, default: 0, suffix: "%" },
      { id: "hue", label: "Hue Shift", type: "range", min: -180, max: 180, step: 1, default: 0, suffix: "°" },
      { id: "temperature", label: "Temperature", type: "range", min: -50, max: 50, step: 1, default: 0, suffix: "K" },
      { id: "vibrance", label: "Vibrance", type: "range", min: 0, max: 100, step: 5, default: 50, suffix: "%" },
      { id: "flip-h", label: "Flip Horizontal", type: "toggle", default: false },
      { id: "flip-v", label: "Flip Vertical", type: "toggle", default: false },
    ]
  },
  {
    id: "crop",
    name: "Crop & Scale",
    icon: "🖼️",
    settings: [
      { id: "crop-x", label: "Crop X", type: "range", min: 0, max: 100, step: 1, default: 0, suffix: "%" },
      { id: "crop-y", label: "Crop Y", type: "range", min: 0, max: 100, step: 1, default: 0, suffix: "%" },
      { id: "crop-width", label: "Crop Width", type: "range", min: 0, max: 100, step: 1, default: 100, suffix: "%" },
      { id: "crop-height", label: "Crop Height", type: "range", min: 0, max: 100, step: 1, default: 100, suffix: "%" },
      { id: "zoom", label: "Zoom", type: "range", min: 0.5, max: 3, step: 0.1, default: 1, suffix: "x" },
      { id: "aspect-ratio", label: "Aspect Ratio", type: "select", options: ["16:9", "4:3", "1:1", "9:16", "21:9"], default: "16:9" },
    ]
  },
  {
    id: "audio",
    name: "Audio",
    icon: "🔊",
    settings: [
      { id: "audio-normalization", label: "Auto Normalize", type: "toggle", default: false },
      { id: "audio-eq-low", label: "Bass (Low Freq)", type: "range", min: -20, max: 20, step: 1, default: 0, suffix: "dB" },
      { id: "audio-eq-mid", label: "Mids", type: "range", min: -20, max: 20, step: 1, default: 0, suffix: "dB" },
      { id: "audio-eq-high", label: "Treble (High Freq)", type: "range", min: -20, max: 20, step: 1, default: 0, suffix: "dB" },
      { id: "noise-reduction", label: "Noise Reduction", type: "range", min: 0, max: 100, step: 5, default: 0, suffix: "%" },
      { id: "fade-in-duration", label: "Fade In Duration", type: "range", min: 0, max: 5, step: 0.1, default: 0, suffix: "s" },
      { id: "fade-out-duration", label: "Fade Out Duration", type: "range", min: 0, max: 5, step: 0.1, default: 0, suffix: "s" },
    ]
  },
  {
    id: "effects",
    name: "Effects",
    icon: "✨",
    settings: [
      { id: "vignette", label: "Vignette", type: "range", min: 0, max: 100, step: 5, default: 0, suffix: "%" },
      { id: "grain", label: "Film Grain", type: "range", min: 0, max: 100, step: 5, default: 0, suffix: "%" },
      { id: "glow", label: "Glow", type: "range", min: 0, max: 100, step: 5, default: 0, suffix: "%" },
      { id: "bloom", label: "Bloom", type: "range", min: 0, max: 100, step: 5, default: 0, suffix: "%" },
      { id: "chromatic-aberration", label: "Chromatic Aberration", type: "range", min: 0, max: 100, step: 5, default: 0, suffix: "%" },
    ]
  },
  {
    id: "advanced",
    name: "Advanced",
    icon: "⚙️",
    settings: [
      { id: "stabilization", label: "Video Stabilization", type: "toggle", default: false },
      { id: "auto-enhance", label: "AI Auto-Enhance", type: "toggle", default: false },
      { id: "motion-interpolation", label: "Motion Interpolation", type: "toggle", default: false },
      { id: "bitrate", label: "Video Bitrate", type: "select", options: ["2M", "5M", "10M", "20M", "50M"], default: "10M" },
      { id: "codec", label: "Video Codec", type: "select", options: ["H.264", "H.265", "VP9", "AV1"], default: "H.264" },
      { id: "color-space", label: "Color Space", type: "select", options: ["Rec.709", "DCI-P3", "Rec.2020"], default: "Rec.709" },
      { id: "frame-interpolation", label: "Frame Interpolation", type: "range", min: 0, max: 100, step: 10, default: 0, suffix: "%" },
    ]
  },
];

export default function AdvancedVideoEditorSettings({ onSettingChange }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState(
    settingCategories.reduce((acc, cat) => ({ ...acc, [cat.id]: true }), {})
  );
  const [settingsValues, setSettingsValues] = useState({});

  // Search across all settings
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return settingCategories;
    
    const query = searchQuery.toLowerCase();
    return settingCategories.map(category => ({
      ...category,
      settings: category.settings.filter(
        setting => 
          setting.label.toLowerCase().includes(query) ||
          setting.id.toLowerCase().includes(query)
      )
    })).filter(category => category.settings.length > 0);
  }, [searchQuery]);

  const handleSettingChange = (settingId, value) => {
    setSettingsValues(prev => ({ ...prev, [settingId]: value }));
    onSettingChange?.(settingId, value);
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  return (
    <div className="space-y-2.5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1.5 w-3.5 h-3.5 text-blue-400/40" />
        <Input
          placeholder="Search settings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-7 text-xs bg-blue-950/40 border-blue-900/40 focus:border-blue-600"
        />
      </div>

      {/* Settings Categories */}
      <div className="space-y-1.5 max-h-[calc(100vh-500px)] overflow-y-auto">
        {filteredCategories.map(category => (
          <div key={category.id} className="border border-blue-900/30 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 bg-blue-950/30 hover:bg-blue-950/50 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{category.icon}</span>
                <span className="text-xs font-semibold text-blue-300">{category.name}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-blue-400/60 transition-transform ${expandedCategories[category.id] ? "rotate-180" : ""}`} />
            </button>

            {expandedCategories[category.id] && (
              <div className="bg-blue-950/10 p-1.5 space-y-1.5 border-t border-blue-900/20">
                {category.settings.map(setting => (
                  <div key={setting.id} className="space-y-0.5">
                    <label className="text-xs font-medium text-blue-400/70 block">{setting.label}</label>
                    {setting.type === "range" && (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="range"
                          min={setting.min}
                          max={setting.max}
                          step={setting.step}
                          defaultValue={setting.default}
                          onChange={(e) => handleSettingChange(setting.id, parseFloat(e.target.value))}
                          className="flex-1 h-1.5 rounded-full accent-cyan-500"
                        />
                        <span className="text-xs font-bold text-cyan-400 w-10 text-right">
                          {(settingsValues[setting.id] ?? setting.default).toFixed(1)}{setting.suffix}
                        </span>
                      </div>
                    )}
                    {setting.type === "select" && (
                      <select
                        defaultValue={setting.default}
                        onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                        className="w-full h-6 text-xs bg-blue-950/40 border border-blue-900/40 rounded-lg text-blue-200 font-medium outline-none"
                      >
                        {setting.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                    {setting.type === "toggle" && (
                      <button
                        onClick={(e) => {
                          const newValue = !((settingsValues[setting.id] ?? setting.default));
                          handleSettingChange(setting.id, newValue);
                        }}
                        className={`w-full h-6 rounded-lg text-xs font-semibold transition-all ${
                          (settingsValues[setting.id] ?? setting.default) 
                            ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white" 
                            : "bg-blue-950/40 border border-blue-900/40 text-blue-400"
                        }`}
                      >
                        {(settingsValues[setting.id] ?? setting.default) ? "Enabled" : "Disabled"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-4 text-blue-400/40 text-xs">
          No settings found for "{searchQuery}"
        </div>
      )}
    </div>
  );
}