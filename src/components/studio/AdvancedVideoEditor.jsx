import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Play, Pause, Download, Trash2, Volume2, Type, Palette, Music, Image, Sparkles, X, Search, Plus, Folder, FileVideo, Settings, Zap, Layers, Filter, Sliders, Wand2, Copy, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import AIContentTools from "./AIContentTools";

// Filter presets based on professional editors
const filterPresets = [
  { name: "Cinematic", values: { saturation: 1.2, contrast: 1.1, warmth: 10 } },
  { name: "B&W", values: { saturation: 0, contrast: 1.2, brightness: 1 } },
  { name: "Cool", values: { saturation: 1.1, coolness: 20, contrast: 1.05 } },
  { name: "Warm", values: { saturation: 1.1, warmth: 30, contrast: 1.05 } },
  { name: "Vintage", values: { saturation: 0.8, sepia: 0.3, vignette: 0.2 } },
  { name: "High Contrast", values: { contrast: 1.5, saturation: 0.9, shadows: -20 } },
];

const transitionTypes = [
  { name: "Cut", duration: 0 },
  { name: "Fade", duration: 0.5 },
  { name: "Dissolve", duration: 1 },
  { name: "Slide", duration: 0.8 },
  { name: "Zoom", duration: 0.6 },
  { name: "Blur", duration: 0.7 },
];

const presets = [
  { name: "YouTube", width: 1280, height: 720, ratio: "16:9" },
  { name: "Square", width: 1080, height: 1080, ratio: "1:1" },
  { name: "Twitter", width: 1024, height: 512, ratio: "2:1" },
  { name: "Vertical", width: 1080, height: 1920, ratio: "9:16" },
  { name: "4K", width: 3840, height: 2160, ratio: "16:9" },
];

const textAnimations = [
  { name: "Fade In", keyframes: [{ offset: 0, opacity: 0 }, { offset: 1, opacity: 1 }] },
  { name: "Slide Left", keyframes: [{ offset: 0, transform: "translateX(-100px)", opacity: 0 }, { offset: 1, transform: "translateX(0)", opacity: 1 }] },
  { name: "Scale Up", keyframes: [{ offset: 0, transform: "scale(0.5)", opacity: 0 }, { offset: 1, transform: "scale(1)", opacity: 1 }] },
  { name: "Bounce", keyframes: [{ offset: 0, transform: "translateY(20px)" }, { offset: 1, transform: "translateY(0)" }] },
];

export default function AdvancedVideoEditor() {
  const [user, setUser] = useState(null);
  const [video, setVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [searchMedia, setSearchMedia] = useState("");
  const [activePanel, setActivePanel] = useState("effects");
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiType, setAiType] = useState(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Color grading
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [hue, setHue] = useState(0);
  const [shadows, setShadows] = useState(0);
  const [highlights, setHighlights] = useState(0);
  const [temperature, setTemperature] = useState(0);
  const [tint, setTint] = useState(0);

  // Effects
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [vignette, setVignette] = useState(0);
  const [blur, setBlur] = useState(0);
  const [sharpness, setSharpness] = useState(0);

  // Text & subtitles
  const [texts, setTexts] = useState([]);
  const [selectedTextIdx, setSelectedTextIdx] = useState(null);
  const [textContent, setTextContent] = useState("");
  const [textSize, setTextSize] = useState(48);
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [textAnimation, setTextAnimation] = useState("Fade In");

  // Layers
  const [layers, setLayers] = useState([]);
  const [selectedLayer, setSelectedLayer] = useState(null);

  // Transitions
  const [selectedTransition, setSelectedTransition] = useState("Cut");
  const [transitionDuration, setTransitionDuration] = useState(0.5);

  const videoRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: mediaAssets = [] } = useQuery({
    queryKey: ["media-assets", user?.email],
    queryFn: () => user?.email ? base44.entities.MediaAsset.filter({ created_by: user.email }, "-created_date", 100) : Promise.resolve([]),
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
  });

  const filteredMedia = mediaAssets.filter(m => 
    m.name?.toLowerCase().includes(searchMedia.toLowerCase())
  );

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024 * 1024) {
        toast.error("File must be smaller than 5GB");
        return;
      }
      const url = URL.createObjectURL(file);
      setVideo({ name: file.name, url, file });
      setStartTime(0);
      toast.success("Video loaded!");
    }
  };

  const handlePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setEndTime(videoRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleDownloadVideo = () => {
    if (!video) {
      toast.error("No video loaded");
      return;
    }
    const link = document.createElement("a");
    link.href = video.url;
    link.download = video.name;
    link.click();
    toast.success("Video exported!");
  };

  const applyFilterPreset = (preset) => {
    setSelectedFilter(preset.name);
    if (preset.values.saturation) setSaturation(preset.values.saturation * 100);
    if (preset.values.contrast) setContrast(preset.values.contrast * 100);
    if (preset.values.warmth) setTemperature(preset.values.warmth);
    toast.success(`${preset.name} filter applied!`);
  };

  const addTextOverlay = () => {
    const newText = {
      id: Date.now(),
      content: textContent || "New Text",
      size: textSize,
      color: textColor,
      startTime: currentTime,
      duration: 5,
      animation: textAnimation,
      x: 50,
      y: 50,
    };
    setTexts([...texts, newText]);
    setTextContent("");
    toast.success("Text overlay added!");
  };

  const deleteText = (id) => {
    setTexts(texts.filter(t => t.id !== id));
  };

  const updateText = (id, updates) => {
    setTexts(texts.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const filterStyle = video ? {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg) drop-shadow(0 0 ${vignette * 2}px rgba(0,0,0,${vignette / 100}))`,
  } : {};

  return (
    <div className="flex h-[calc(100vh-120px)] bg-[#0a0e27] text-white gap-0 rounded-2xl overflow-hidden border border-blue-900/40 shadow-2xl">
      {/* LEFT SIDEBAR - Media Library */}
      <div className="w-56 border-r border-blue-900/40 flex flex-col bg-[#060d18] overflow-hidden">
        <div className="p-3 border-b border-blue-900/40">
          <h3 className="text-xs font-bold mb-2 uppercase tracking-wider text-blue-300">Media</h3>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 w-3 h-3 text-blue-400/40" />
            <Input
              placeholder="Search..."
              value={searchMedia}
              onChange={(e) => setSearchMedia(e.target.value)}
              className="pl-7 h-7 text-xs bg-[#050a14] border-blue-900/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-blue-900/40 rounded cursor-pointer hover:border-blue-600/60 transition-colors">
            <Upload className="w-5 h-5 text-blue-400/60 mb-1" />
            <p className="text-xs text-center text-blue-400/60">Upload</p>
            <input type="file" accept="video/*,image/*,audio/*" onChange={handleVideoUpload} className="hidden" />
          </label>

          {filteredMedia.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {filteredMedia.slice(0, 12).map(m => (
                <div key={m.id} className="group relative rounded overflow-hidden bg-[#050a14] border border-blue-900/40 hover:border-blue-500/60 transition-colors cursor-pointer">
                  {m.type === "image" && m.url && (
                    <img src={m.url} alt={m.name} className="w-full aspect-square object-cover group-hover:scale-110 transition-transform" />
                  )}
                  {m.type === "video" && (
                    <div className="w-full aspect-square flex items-center justify-center bg-black">
                      <FileVideo className="w-4 h-4 text-blue-400/40" />
                    </div>
                  )}
                  {m.type === "audio" && (
                    <div className="w-full aspect-square flex items-center justify-center bg-[#050a14]">
                      <Music className="w-4 h-4 text-blue-400/40" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-blue-400/40 text-xs">
              <Folder className="w-6 h-6 mx-auto mb-1 opacity-50" />
              No media
            </div>
          )}
        </div>
      </div>

      {/* CENTER - Video Preview & Timeline */}
      <div className="flex-1 flex flex-col border-r border-blue-900/40 bg-[#050a14]">
        {/* Toolbar */}
        <div className="h-10 border-b border-blue-900/40 flex items-center gap-1 px-3 bg-[#0a0e27] justify-between">
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={handlePlay} className="h-7 w-7 p-0">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1">
              <span className="text-blue-400/60">{currentTime.toFixed(2)}s / {duration.toFixed(2)}s</span>
            </Button>
          </div>
          <div className="flex gap-1">
            <Button size="sm" onClick={handleDownloadVideo} className="gap-1 h-7 text-xs">
              <Download className="w-3 h-3" /> Export
            </Button>
          </div>
        </div>

        {/* Video Preview */}
        <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
          {video ? (
            <div className="relative w-full h-full flex items-center justify-center" style={filterStyle}>
              <video
                ref={videoRef}
                src={video.url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                className="w-full h-full object-contain"
              />
              {texts.map(text => (
                <div
                  key={text.id}
                  className="absolute pointer-events-none font-bold"
                  style={{
                    left: `${text.x}%`,
                    top: `${text.y}%`,
                    fontSize: `${text.size}px`,
                    color: text.color,
                    textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                  }}
                >
                  {text.content}
                </div>
              ))}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30 cursor-pointer" onClick={handlePlay}>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <FileVideo className="w-12 h-12 text-blue-400/30 mx-auto mb-2" />
              <p className="text-sm text-blue-400/50">No video loaded</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        {video && (
          <div className="h-28 border-t border-blue-900/40 bg-[#0a0e27] p-2 space-y-2 overflow-x-auto">
            <div className="flex justify-between text-xs text-blue-400/60">
              <span>{currentTime.toFixed(2)}s</span>
              <span>{duration.toFixed(2)}s</span>
            </div>

            <div className="relative h-2 bg-[#050a14] rounded cursor-pointer group">
              <div className="absolute h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded" style={{ width: `${progressPercent}%` }} />
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={(e) => {
                  const newTime = parseFloat(e.target.value);
                  if (videoRef.current) videoRef.current.currentTime = newTime;
                  setCurrentTime(newTime);
                }}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>

            <div className="h-14 bg-[#050a14] rounded border border-blue-900/40 flex items-end justify-around p-1 gap-0.5 overflow-x-auto">
              {Array.from({ length: 60 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-cyan-500/60 to-blue-500/30 rounded-t text-[0.5px]"
                  style={{ minWidth: "2px", height: `${30 + Math.random() * 70}%` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR - Advanced Controls */}
      <div className="w-80 border-l border-blue-900/40 flex flex-col bg-[#060d18] overflow-hidden">
        <Tabs value={activePanel} onValueChange={setActivePanel} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full h-auto justify-start gap-1 p-2 bg-[#0a0e27] rounded-none border-b border-blue-900/40">
            <TabsTrigger value="effects" className="text-xs h-7 gap-1"><Sliders className="w-3 h-3" /> Color</TabsTrigger>
            <TabsTrigger value="filters" className="text-xs h-7 gap-1"><Filter className="w-3 h-3" /> Filters</TabsTrigger>
            <TabsTrigger value="text" className="text-xs h-7 gap-1"><Type className="w-3 h-3" /> Text</TabsTrigger>
            <TabsTrigger value="transitions" className="text-xs h-7 gap-1"><Zap className="w-3 h-3" /> Trans</TabsTrigger>
            <TabsTrigger value="ai" className="text-xs h-7 gap-1"><Sparkles className="w-3 h-3" /> AI</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-3">
            {/* Color Correction */}
            <TabsContent value="effects" className="space-y-3 m-0">
              {[
                { label: "Brightness", value: brightness, onChange: setBrightness, min: 50, max: 150 },
                { label: "Contrast", value: contrast, onChange: setContrast, min: 50, max: 150 },
                { label: "Saturation", value: saturation, onChange: setSaturation, min: 0, max: 200 },
                { label: "Hue", value: hue, onChange: setHue, min: -180, max: 180 },
                { label: "Shadows", value: shadows, onChange: setShadows, min: -100, max: 100 },
                { label: "Highlights", value: highlights, onChange: setHighlights, min: -100, max: 100 },
                { label: "Temperature", value: temperature, onChange: setTemperature, min: -50, max: 50 },
                { label: "Tint", value: tint, onChange: setTint, min: -50, max: 50 },
              ].map((ctrl) => (
                <div key={ctrl.label}>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-blue-400/60">{ctrl.label}</label>
                    <span className="text-xs text-blue-400/40">{ctrl.value}</span>
                  </div>
                  <input type="range" min={ctrl.min} max={ctrl.max} value={ctrl.value} onChange={(e) => ctrl.onChange(parseFloat(e.target.value))} className="w-full h-1" />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-blue-400/60 block mb-2">Vignette</label>
                <input type="range" min="0" max="100" value={vignette} onChange={(e) => setVignette(parseFloat(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="text-xs font-medium text-blue-400/60 block mb-2">Blur</label>
                <input type="range" min="0" max="20" value={blur} onChange={(e) => setBlur(parseFloat(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="text-xs font-medium text-blue-400/60 block mb-2">Sharpness</label>
                <input type="range" min="-50" max="100" value={sharpness} onChange={(e) => setSharpness(parseFloat(e.target.value))} className="w-full" />
              </div>
            </TabsContent>

            {/* Filter Presets */}
            <TabsContent value="filters" className="space-y-2 m-0">
              <div className="grid grid-cols-2 gap-2">
                {filterPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyFilterPreset(preset)}
                    className={`p-2 rounded text-xs font-medium border transition-all ${
                      selectedFilter === preset.name
                        ? "border-cyan-500 bg-cyan-900/30 text-cyan-300"
                        : "border-blue-900/40 text-blue-400/60 hover:border-blue-600/40"
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </TabsContent>

            {/* Text Overlays */}
            <TabsContent value="text" className="space-y-3 m-0">
              <div className="space-y-2">
                <Input
                  placeholder="Text content"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="h-8 text-xs bg-[#050a14]"
                />
                <div>
                  <label className="text-xs text-blue-400/60 block mb-1">Size: {textSize}px</label>
                  <input type="range" min="12" max="120" value={textSize} onChange={(e) => setTextSize(parseInt(e.target.value))} className="w-full" />
                </div>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-blue-900/40"
                  />
                  <select
                    value={textAnimation}
                    onChange={(e) => setTextAnimation(e.target.value)}
                    className="flex-1 h-8 text-xs bg-[#050a14] border border-blue-900/40 rounded px-2 text-blue-400/60"
                  >
                    {textAnimations.map(a => (
                      <option key={a.name} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <Button onClick={addTextOverlay} className="w-full gap-2 h-8 text-xs">
                  <Plus className="w-3 h-3" /> Add Text
                </Button>
              </div>

              {texts.length > 0 && (
                <div className="border-t border-blue-900/40 pt-2">
                  <p className="text-xs font-medium text-blue-400/60 mb-2">Text Layers ({texts.length})</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {texts.map((text) => (
                      <div
                        key={text.id}
                        className="p-2 bg-[#050a14] rounded border border-blue-900/40 text-xs flex justify-between items-center cursor-pointer hover:border-blue-600/40"
                        onClick={() => setSelectedTextIdx(texts.indexOf(text))}
                      >
                        <span className="text-blue-400/60 truncate">{text.content}</span>
                        <button onClick={() => deleteText(text.id)} className="text-red-400/60 hover:text-red-400">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Transitions */}
            <TabsContent value="transitions" className="space-y-3 m-0">
              <div className="grid grid-cols-2 gap-2">
                {transitionTypes.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => { setSelectedTransition(t.name); setTransitionDuration(t.duration); }}
                    className={`p-2 rounded text-xs font-medium border transition-all ${
                      selectedTransition === t.name
                        ? "border-cyan-500 bg-cyan-900/30 text-cyan-300"
                        : "border-blue-900/40 text-blue-400/60 hover:border-blue-600/40"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs font-medium text-blue-400/60 block mb-2">Duration: {transitionDuration.toFixed(2)}s</label>
                <input type="range" min="0" max="3" step="0.1" value={transitionDuration} onChange={(e) => setTransitionDuration(parseFloat(e.target.value))} className="w-full" />
              </div>
            </TabsContent>

            {/* AI Tools */}
            <TabsContent value="ai" className="space-y-3 m-0">
              <AIContentTools />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* AI Modal */}
      {aiModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => !aiLoading && setAiModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#060d18] rounded-2xl border border-blue-900/40 shadow-lg max-w-md w-full p-6 space-y-4"
          >
            <h3 className="font-bold text-blue-100">Generate Content</h3>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe what you want..."
              rows={4}
              className="w-full bg-[#050a14] border border-blue-900/40 rounded-lg p-3 text-sm text-blue-100 placeholder-blue-400/30 outline-none focus:border-blue-500"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAiModalOpen(false)} className="flex-1">Cancel</Button>
              <Button className="flex-1">Generate</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}