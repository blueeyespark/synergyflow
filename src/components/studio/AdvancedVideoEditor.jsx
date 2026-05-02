import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Play, Pause, Download, Trash2, Volume2, Type, Palette, Music, Image, Sparkles, MessageSquare, X, Search, Plus, Folder, FileVideo, Settings, Layers, Zap, Filter as FilterIcon, RotateCcw, Copy, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import AIContentTools from "./AIContentTools";

const presets = [
  { name: "YouTube", width: 1280, height: 720, ratio: "16:9" },
  { name: "Square", width: 1080, height: 1080, ratio: "1:1" },
  { name: "Vertical", width: 1080, height: 1920, ratio: "9:16" },
];

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

const textAnimations = [
  { id: "fade-in", name: "Fade In" },
  { id: "slide-left", name: "Slide Left" },
  { id: "slide-right", name: "Slide Right" },
  { id: "bounce", name: "Bounce" },
  { id: "scale", name: "Scale" },
  { id: "pop", name: "Pop" },
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
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [activeTab, setActiveTab] = useState("media");
  const [searchMedia, setSearchMedia] = useState("");
  const [selectedTransition, setSelectedTransition] = useState("fade");
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [selectedTextAnimation, setSelectedTextAnimation] = useState("fade-in");
  const [textOverlay, setTextOverlay] = useState("");
  const [textSize, setTextSize] = useState(32);
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiType, setAiType] = useState(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Thumbnail state
  const canvasRef = useRef(null);
  const [preset, setPreset] = useState(presets[0]);
  const [bgColor, setBgColor] = useState("#FF6B6B");
  const [mainText, setMainText] = useState("AWESOME VIDEO");
  const [fontSize, setFontSize] = useState(60);
  const [uploadedImage, setUploadedImage] = useState(null);

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
    toast.success("Video downloaded!");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target.result);
        toast.success("Image loaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  const drawThumbnail = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = preset.width;
    canvas.height = preset.height;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, preset.width, preset.height);

    if (uploadedImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, preset.width, preset.height);
        drawText();
      };
      img.src = uploadedImage;
    } else {
      drawText();
    }

    function drawText() {
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      ctx.fillText(mainText, preset.width / 2, preset.height / 2);
    }
  };

  useEffect(() => {
    drawThumbnail();
  }, [bgColor, mainText, fontSize, uploadedImage, preset]);

  const handleDownloadThumbnail = () => {
    drawThumbnail();
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `thumbnail_${preset.name.toLowerCase()}.png`;
    link.click();
    toast.success("Thumbnail downloaded!");
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    setAiLoading(true);
    try {
      if (aiType === "image") {
        const { url } = await base44.integrations.Core.GenerateImage({ prompt: aiPrompt });
        setUploadedImage(url);
        toast.success("Image generated!");
      }
      setAiModalOpen(false);
      setAiPrompt("");
    } catch (e) {
      toast.error("Generation failed: " + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const filterStyle = (() => {
    const f = filterPresets.find(p => p.id === selectedFilter);
    if (!f || !video) return {};
    return {
      filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${f.filters.sepia || 0}%) grayscale(${f.filters.grayscale || 0}%)`,
    };
  })();

  return (
    <div className="flex h-[calc(100vh-120px)] bg-gradient-to-br from-[#0a0e27] to-[#050a14] text-white gap-0 rounded-2xl overflow-hidden border border-blue-900/60 shadow-2xl">
      {/* LEFT SIDEBAR - Media & Transitions */}
      <div className="w-48 border-r border-blue-900/50 flex flex-col bg-gradient-to-b from-[#0d1628] to-[#050a14] overflow-hidden">
        <div className="flex gap-1 p-2.5 border-b border-blue-900/50 bg-gradient-to-r from-blue-950/40 to-transparent">
          <button onClick={() => setActiveTab("media")} className={`flex-1 px-2 py-1.5 text-xs rounded-lg font-semibold transition-all ${activeTab === "media" ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20" : "text-blue-300/70 hover:bg-blue-900/30 border border-blue-900/30"}`}>📁 Media</button>
          <button onClick={() => setActiveTab("effects")} className={`flex-1 px-2 py-1.5 text-xs rounded-lg font-semibold transition-all ${activeTab === "effects" ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/20" : "text-blue-300/70 hover:bg-blue-900/30 border border-blue-900/30"}`}>✨ Effects</button>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
          {activeTab === "media" && (
            <>
              <label className="flex flex-col items-center justify-center p-2 border-2 border-dashed border-blue-900/40 rounded-lg cursor-pointer hover:border-blue-600/60 transition-colors">
                <Upload className="w-4 h-4 text-blue-400/60 mb-0.5" />
                <p className="text-xs text-center text-blue-400/60">Upload</p>
                <input type="file" accept="video/*,image/*,audio/*" onChange={handleVideoUpload} className="hidden" />
              </label>
              <div className="relative">
                <Search className="absolute left-2 top-1.5 w-3 h-3 text-blue-400/40" />
                <Input
                  placeholder="Search..."
                  value={searchMedia}
                  onChange={(e) => setSearchMedia(e.target.value)}
                  className="pl-6 h-6 text-xs bg-[#050a14] border-blue-900/40"
                />
              </div>
              {filteredMedia.length > 0 ? (
                <div className="grid grid-cols-3 gap-1.5">
                  {filteredMedia.slice(0, 9).map(m => (
                    <div key={m.id} className="group relative rounded overflow-hidden bg-[#050a14] border border-blue-900/40 hover:border-blue-500/60 transition-colors cursor-pointer aspect-square">
                      {m.type === "image" && m.url && (
                        <img src={m.url} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      )}
                      {m.type !== "image" && (
                        <div className="w-full h-full flex items-center justify-center bg-black">
                          <FileVideo className="w-3 h-3 text-blue-400/40" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4"><Folder className="w-5 h-5 text-blue-400/30 mx-auto mb-1" /><p className="text-xs text-blue-400/40">No media</p></div>
              )}
            </>
          )}

          {activeTab === "effects" && (
            <>
              <div>
                <p className="text-xs font-semibold text-blue-300 mb-1.5">Transitions</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {transitions.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTransition(t.id)}
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
                      onClick={() => setSelectedFilter(f.id)}
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
          )}
        </div>
      </div>

      {/* CENTER - Video Preview & Timeline */}
      <div className="flex-1 flex flex-col border-r border-blue-900/50 bg-gradient-to-b from-[#030609] to-[#0a0e27]">
        {/* Toolbar */}
        <div className="h-10 border-b border-blue-900/50 flex items-center gap-1 px-3 bg-gradient-to-r from-blue-950/40 via-[#0a0e27] to-transparent">
          {video && (
            <>
              <Button size="sm" variant="ghost" onClick={handlePlay} className="h-7 px-2 text-xs rounded-lg hover:bg-cyan-500/20 transition-all gap-1.5">{isPlaying ? <Pause className="w-3.5 h-3.5 text-cyan-400" /> : <Play className="w-3.5 h-3.5 text-cyan-400" />}{isPlaying ? "Pause" : "Play"}</Button>
              <div className="flex-1" />
              <Button size="sm" onClick={handleDownloadVideo} className="gap-1 h-7 px-2.5 text-xs bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg font-semibold shadow-lg shadow-cyan-500/20 transition-all"><Download className="w-3 h-3" /> Export</Button>
            </>
          )}
        </div>

        {/* Video Preview */}
        <div className="flex-1 flex items-center justify-center bg-black relative group overflow-hidden">
          {video ? (
            <div className="relative w-full h-full flex items-center justify-center" style={filterStyle}>
              <video
                ref={videoRef}
                src={video.url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                className="w-full h-full object-contain"
                style={{ volume: volume }}
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 cursor-pointer" onClick={handlePlay}>
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                  {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
                </div>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center cursor-pointer hover:opacity-75 transition-opacity w-full h-full">
              <FileVideo className="w-12 h-12 text-blue-400/30 mb-2" />
              <p className="text-xs text-blue-400/50">Click to upload video or drag & drop</p>
              <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
            </label>
          )}
        </div>

        {/* Timeline */}
        {video && (
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
                onChange={(e) => {
                  const newTime = parseFloat(e.target.value);
                  if (videoRef.current) videoRef.current.currentTime = newTime;
                  setCurrentTime(newTime);
                }}
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
        )}
      </div>

      {/* RIGHT SIDEBAR - Advanced Controls */}
      <div className="w-72 border-l border-blue-900/50 flex flex-col bg-gradient-to-b from-[#0d1628] to-[#050a14] overflow-y-auto">
        <div className="p-2.5 border-b border-blue-900/50 bg-gradient-to-r from-blue-950/40 to-transparent">
          <h3 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">⚙️ Settings</h3>
        </div>

        <div className="flex-1 p-3 space-y-3 text-sm overflow-y-auto">
          {/* Brightness */}
          <div className="space-y-1 bg-blue-950/20 rounded-lg p-2 border border-blue-900/30">
            <label className="text-xs font-semibold text-cyan-300 block">☀️ Brightness</label>
            <div className="flex items-center gap-2">
              <input type="range" min="50" max="150" value={brightness} onChange={(e) => setBrightness(parseFloat(e.target.value))} className="flex-1 h-1.5 rounded-full" />
              <span className="text-xs font-bold text-cyan-400 w-8 text-right">{brightness}%</span>
            </div>
          </div>

          {/* Contrast */}
          <div className="space-y-1 bg-purple-950/20 rounded-lg p-2 border border-purple-900/30">
            <label className="text-xs font-semibold text-purple-300 block">🎯 Contrast</label>
            <div className="flex items-center gap-2">
              <input type="range" min="50" max="150" value={contrast} onChange={(e) => setContrast(parseFloat(e.target.value))} className="flex-1 h-1.5 rounded-full" />
              <span className="text-xs font-bold text-purple-400 w-8 text-right">{contrast}%</span>
            </div>
          </div>

          {/* Saturation */}
          <div className="space-y-1 bg-pink-950/20 rounded-lg p-2 border border-pink-900/30">
            <label className="text-xs font-semibold text-pink-300 block">🎨 Saturation</label>
            <div className="flex items-center gap-2">
              <input type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(parseFloat(e.target.value))} className="flex-1 h-1.5 rounded-full" />
              <span className="text-xs font-bold text-pink-400 w-8 text-right">{saturation}%</span>
            </div>
          </div>

          {/* Volume */}
          <div className="space-y-1 bg-green-950/20 rounded-lg p-2 border border-green-900/30">
            <label className="text-xs font-semibold text-green-300 block">🔊 Volume</label>
            <div className="flex items-center gap-2">
              <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="flex-1 h-1.5 rounded-full" />
              <span className="text-xs font-bold text-green-400 w-8 text-right">{(volume * 100).toFixed(0)}%</span>
            </div>
          </div>

          {video && (
            <>
              <div className="space-y-1 bg-orange-950/20 rounded-lg p-2 border border-orange-900/30">
                <label className="text-xs font-semibold text-orange-300 block">▶️ Start Time</label>
                <div className="flex items-center gap-2">
                  <input type="range" min="0" max={duration} value={startTime} onChange={(e) => setStartTime(Math.min(parseFloat(e.target.value), endTime))} className="flex-1 h-1.5 rounded-full" />
                  <span className="text-xs font-bold text-orange-400 w-12 text-right">{startTime.toFixed(2)}s</span>
                </div>
              </div>

              <div className="space-y-1 bg-red-950/20 rounded-lg p-2 border border-red-900/30">
                <label className="text-xs font-semibold text-red-300 block">⏹️ End Time</label>
                <div className="flex items-center gap-2">
                  <input type="range" min="0" max={duration} value={endTime} onChange={(e) => setEndTime(Math.max(parseFloat(e.target.value), startTime))} className="flex-1 h-1.5 rounded-full" />
                  <span className="text-xs font-bold text-red-400 w-12 text-right">{endTime.toFixed(2)}s</span>
                </div>
              </div>
            </>
          )}

          {/* Text Overlay */}
          <div className="pt-2.5 border-t border-blue-900/40 space-y-2">
            <h4 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">📝 Text Overlay</h4>
            <Input value={textOverlay} onChange={(e) => setTextOverlay(e.target.value)} placeholder="Add text..." className="h-7 text-xs bg-blue-950/40 border-blue-900/40 focus:border-blue-600" />
            <div>
              <label className="text-xs font-semibold text-purple-300 block mb-1">Size: {textSize}px</label>
              <input type="range" min="12" max="72" value={textSize} onChange={(e) => setTextSize(parseInt(e.target.value))} className="w-full h-1.5 rounded-full" />
            </div>
            <div>
              <label className="text-xs font-semibold text-pink-300 block mb-1">Color</label>
              <div className="flex gap-1.5">
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-8 h-7 rounded-lg cursor-pointer border-2 border-pink-600 shadow-lg shadow-pink-500/20" />
                <Input value={textColor} onChange={(e) => setTextColor(e.target.value)} className="text-xs flex-1 h-7 bg-blue-950/40 border-blue-900/40" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-orange-300 block mb-1">Animation</label>
              <select className="w-full bg-blue-950/40 border border-blue-900/40 rounded-lg text-xs p-1.5 text-blue-100 font-medium">
                {textAnimations.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Thumbnail */}
          <div className="pt-2.5 border-t border-blue-900/40 space-y-2">
            <h4 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">🎬 Thumbnail</h4>
            <div className="bg-gradient-to-b from-blue-950/40 to-purple-950/20 rounded-lg p-1.5 border border-blue-900/30 shadow-inner">
              <canvas ref={canvasRef} className="w-full rounded border border-blue-900/40" style={{ maxHeight: "80px" }} />
            </div>
            <select className="w-full bg-blue-950/40 border border-blue-900/40 rounded-lg text-xs p-1.5 text-blue-100 font-medium">
              {presets.map(p => (
                <option key={p.name} value={p.name}>{p.name} ({p.ratio})</option>
              ))}
            </select>
            <div className="flex gap-1.5">
              <Input value={mainText} onChange={(e) => setMainText(e.target.value)} placeholder="Text" className="text-xs h-7 flex-1 bg-blue-950/40 border-blue-900/40" />
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-8 h-7 rounded-lg cursor-pointer border-2 border-cyan-600 shadow-lg shadow-cyan-500/20" />
            </div>
            <div>
              <label className="text-xs font-semibold text-cyan-300 block mb-1">Font Size: {fontSize}px</label>
              <input type="range" min="20" max="100" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full h-1.5 rounded-full" />
            </div>
            <Button onClick={handleDownloadThumbnail} className="w-full h-7 text-xs gap-1 bg-gradient-to-r from-cyan-600 to-pink-600 hover:from-cyan-500 hover:to-pink-500 rounded-lg font-semibold shadow-lg shadow-cyan-500/20"><Download className="w-3 h-3" /> Download</Button>
          </div>

          {/* AI Tools */}
          <div className="pt-3 border-t border-blue-900/40 space-y-2.5">
            <h4 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">🤖 AI Tools</h4>
            <Button onClick={() => { setAiType("image"); setAiModalOpen(true); }} className="w-full h-7 text-xs gap-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-semibold shadow-lg shadow-purple-500/20"><Sparkles className="w-3 h-3" /> Generate Image</Button>
            <div className="bg-purple-950/20 rounded-lg p-2 border border-purple-900/30 space-y-2">
              <AIContentTools />
            </div>
          </div>
        </div>
      </div>

      {/* AI Modal */}
      {aiModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => !aiLoading && setAiModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-[#0d1628] to-[#050a14] rounded-2xl border border-blue-900/60 shadow-2xl shadow-purple-500/20 max-w-md w-full p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">✨ Generate {aiType === "image" ? "Image" : "Content"}</h3>
              <button onClick={() => setAiModalOpen(false)} className="p-1 hover:bg-blue-900/40 rounded-lg transition-colors"><X className="w-3.5 h-3.5 text-blue-400" /></button>
            </div>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe what you want to create..."
              rows={3}
              className="w-full bg-blue-950/40 border border-blue-900/40 focus:border-cyan-600 rounded-lg text-xs text-blue-100 placeholder-blue-400/40 p-2 outline-none transition-colors font-medium"
            />
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setAiModalOpen(false)} disabled={aiLoading} className="flex-1 h-8 text-xs font-semibold rounded-lg">Cancel</Button>
              <Button onClick={handleAIGenerate} disabled={aiLoading} className="flex-1 h-8 text-xs gap-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-semibold shadow-lg shadow-purple-500/20 disabled:opacity-50">{aiLoading ? <div className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-3 h-3" />}{aiLoading ? "Generating..." : "Generate"}</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}