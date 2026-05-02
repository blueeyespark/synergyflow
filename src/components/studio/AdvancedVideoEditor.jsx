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
    <div className="flex h-[calc(100vh-120px)] bg-[#0a0e27] text-white gap-0 rounded-2xl overflow-hidden border border-blue-900/40">
      {/* LEFT SIDEBAR - Media & Transitions */}
      <div className="w-56 border-r border-blue-900/40 flex flex-col bg-[#060d18] overflow-hidden">
        <div className="flex gap-1 p-2 border-b border-blue-900/40">
          <button onClick={() => setActiveTab("media")} className={`flex-1 px-2 py-1 text-xs rounded font-medium transition-colors ${activeTab === "media" ? "bg-blue-600 text-white" : "text-blue-400/60 hover:bg-blue-900/20"}`}>Media</button>
          <button onClick={() => setActiveTab("effects")} className={`flex-1 px-2 py-1 text-xs rounded font-medium transition-colors ${activeTab === "effects" ? "bg-blue-600 text-white" : "text-blue-400/60 hover:bg-blue-900/20"}`}>Effects</button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {activeTab === "media" && (
            <>
              <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-blue-900/40 rounded-lg cursor-pointer hover:border-blue-600/60 transition-colors">
                <Upload className="w-5 h-5 text-blue-400/60 mb-1" />
                <p className="text-xs text-center text-blue-400/60">Upload</p>
                <input type="file" accept="video/*,image/*,audio/*" onChange={handleVideoUpload} className="hidden" />
              </label>
              <div className="relative">
                <Search className="absolute left-2 top-1.5 w-3 h-3 text-blue-400/40" />
                <Input
                  placeholder="Search..."
                  value={searchMedia}
                  onChange={(e) => setSearchMedia(e.target.value)}
                  className="pl-6 h-7 text-xs bg-[#050a14] border-blue-900/40"
                />
              </div>
              {filteredMedia.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {filteredMedia.slice(0, 6).map(m => (
                    <div key={m.id} className="group relative rounded overflow-hidden bg-[#050a14] border border-blue-900/40 hover:border-blue-500/60 transition-colors cursor-pointer">
                      {m.type === "image" && m.url && (
                        <img src={m.url} alt={m.name} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform" />
                      )}
                      {m.type !== "image" && (
                        <div className="w-full aspect-square flex items-center justify-center bg-black">
                          <FileVideo className="w-4 h-4 text-blue-400/40" />
                        </div>
                      )}
                      <p className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-0.5 truncate">{m.name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6"><Folder className="w-6 h-6 text-blue-400/30 mx-auto mb-1" /><p className="text-xs text-blue-400/40">No media</p></div>
              )}
            </>
          )}

          {activeTab === "effects" && (
            <>
              <div>
                <p className="text-xs font-semibold text-blue-300 mb-2">Transitions</p>
                <div className="grid grid-cols-2 gap-2">
                  {transitions.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTransition(t.id)}
                      className={`p-2 rounded text-xs font-medium transition-all ${
                        selectedTransition === t.id ? "bg-cyan-600 text-white" : "bg-[#050a14] text-blue-400/60 border border-blue-900/40 hover:border-blue-600/40"
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-300 mb-2">Filters</p>
                <div className="grid grid-cols-2 gap-2">
                  {filterPresets.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFilter(f.id)}
                      className={`p-2 rounded text-xs font-medium transition-all ${
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
      <div className="flex-1 flex flex-col border-r border-blue-900/40 bg-[#050a14]">
        {/* Toolbar */}
        <div className="h-10 border-b border-blue-900/40 flex items-center gap-2 px-3 bg-[#0a0e27]">
          <Button size="sm" variant="ghost" onClick={handlePlay} className="h-7 w-7 p-0">{isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Volume2 className="w-4 h-4" /></Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Type className="w-4 h-4" /></Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><Palette className="w-4 h-4" /></Button>
          <div className="flex-1" />
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><RotateCcw className="w-4 h-4" /></Button>
          <Button size="sm" onClick={handleDownloadVideo} className="gap-1 h-7 px-2 text-xs"><Download className="w-3 h-3" /> Export</Button>
        </div>

        {/* Video Preview */}
        <div className="flex-1 flex items-center justify-center bg-black relative group">
          {video ? (
            <div className="relative w-full h-full flex items-center justify-center" style={filterStyle}>
              <video
                ref={videoRef}
                src={video.url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 cursor-pointer" onClick={handlePlay}>
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                  {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center"><FileVideo className="w-10 h-10 text-blue-400/30 mx-auto mb-2" /><p className="text-xs text-blue-400/50">No video</p></div>
          )}
        </div>

        {/* Timeline */}
        {video && (
          <div className="h-28 border-t border-blue-900/40 bg-[#0a0e27] p-2 space-y-2 overflow-x-auto">
            <div className="flex justify-between text-xs text-blue-400/60">
              <span>{currentTime.toFixed(2)}s</span>
              <span>{duration.toFixed(2)}s</span>
            </div>
            <div className="relative h-1.5 bg-[#050a14] rounded-full cursor-pointer">
              <div className="absolute h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full" style={{ width: `${progressPercent}%` }} />
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
            <div className="h-12 bg-[#050a14] rounded border border-blue-900/40 flex items-end justify-around p-1 gap-0.5">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-cyan-500/60 to-blue-500/30 rounded-t"
                  style={{ height: `${30 + Math.random() * 70}%` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR - Advanced Controls */}
      <div className="w-64 border-l border-blue-900/40 flex flex-col bg-[#060d18] overflow-y-auto">
        <div className="p-3 border-b border-blue-900/40 bg-[#0a0e27]">
          <h3 className="text-sm font-bold">Settings</h3>
        </div>

        <div className="flex-1 p-3 space-y-4 text-sm">
          {/* Brightness */}
          <div>
            <label className="text-xs font-medium text-blue-400/60 block mb-1">Brightness: {brightness}%</label>
            <input type="range" min="50" max="150" value={brightness} onChange={(e) => setBrightness(parseFloat(e.target.value))} className="w-full h-1.5" />
          </div>

          {/* Contrast */}
          <div>
            <label className="text-xs font-medium text-blue-400/60 block mb-1">Contrast: {contrast}%</label>
            <input type="range" min="50" max="150" value={contrast} onChange={(e) => setContrast(parseFloat(e.target.value))} className="w-full h-1.5" />
          </div>

          {/* Saturation */}
          <div>
            <label className="text-xs font-medium text-blue-400/60 block mb-1">Saturation: {saturation}%</label>
            <input type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(parseFloat(e.target.value))} className="w-full h-1.5" />
          </div>

          {/* Volume */}
          <div>
            <label className="text-xs font-medium text-blue-400/60 block mb-1">Volume: {(volume * 100).toFixed(0)}%</label>
            <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-full h-1.5" />
          </div>

          {video && (
            <>
              <div>
                <label className="text-xs font-medium text-blue-400/60 block mb-1">Start: {startTime.toFixed(2)}s</label>
                <input type="range" min="0" max={duration} value={startTime} onChange={(e) => setStartTime(Math.min(parseFloat(e.target.value), endTime))} className="w-full h-1.5" />
              </div>

              <div>
                <label className="text-xs font-medium text-blue-400/60 block mb-1">End: {endTime.toFixed(2)}s</label>
                <input type="range" min="0" max={duration} value={endTime} onChange={(e) => setEndTime(Math.max(parseFloat(e.target.value), startTime))} className="w-full h-1.5" />
              </div>
            </>
          )}

          {/* Text Overlay */}
          <div className="pt-2 border-t border-blue-900/40">
            <label className="text-xs font-medium text-blue-300 block mb-1">Text Overlay</label>
            <Input value={textOverlay} onChange={(e) => setTextOverlay(e.target.value)} placeholder="Add text..." className="h-7 text-xs bg-[#050a14]" />
            <div className="mt-2">
              <label className="text-xs font-medium text-blue-400/60 block mb-1">Size: {textSize}px</label>
              <input type="range" min="12" max="72" value={textSize} onChange={(e) => setTextSize(parseInt(e.target.value))} className="w-full h-1.5" />
            </div>
            <div className="mt-2">
              <label className="text-xs font-medium text-blue-400/60 block mb-1">Color</label>
              <div className="flex gap-2">
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-8 h-7 rounded cursor-pointer border border-blue-900/40" />
                <Input value={textColor} onChange={(e) => setTextColor(e.target.value)} className="text-xs flex-1 h-7 bg-[#050a14]" />
              </div>
            </div>
            <div className="mt-2">
              <label className="text-xs font-medium text-blue-400/60 block mb-1">Animation</label>
              <select className="w-full bg-[#050a14] border border-blue-900/40 rounded text-xs p-1.5 text-blue-100">
                {textAnimations.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Thumbnail */}
          <div className="pt-2 border-t border-blue-900/40">
            <label className="text-xs font-medium text-blue-300 block mb-2">Thumbnail</label>
            <div className="bg-[#050a14] rounded p-2 mb-2">
              <canvas ref={canvasRef} className="w-full rounded border border-blue-900/40" style={{ maxHeight: "100px" }} />
            </div>
            <select className="w-full bg-[#050a14] border border-blue-900/40 rounded text-xs p-1.5 text-blue-100 mb-2">
              {presets.map(p => (
                <option key={p.name} value={p.name}>{p.name} ({p.ratio})</option>
              ))}
            </select>
            <div className="flex gap-2">
              <Input value={mainText} onChange={(e) => setMainText(e.target.value)} placeholder="Text" className="text-xs h-7 flex-1 bg-[#050a14]" />
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-7 rounded cursor-pointer border border-blue-900/40" />
            </div>
            <div className="mt-2">
              <label className="text-xs font-medium text-blue-400/60 block mb-1">Font: {fontSize}px</label>
              <input type="range" min="20" max="100" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full h-1.5" />
            </div>
            <Button onClick={handleDownloadThumbnail} className="w-full mt-2 h-7 text-xs gap-1"><Download className="w-3 h-3" /> Download</Button>
          </div>

          {/* AI Tools */}
          <div className="pt-2 border-t border-blue-900/40">
            <label className="text-xs font-medium text-blue-300 block mb-2">AI Tools</label>
            <Button onClick={() => { setAiType("image"); setAiModalOpen(true); }} className="w-full h-7 text-xs gap-1 mb-2"><Sparkles className="w-3 h-3" /> Generate Image</Button>
            <AIContentTools />
          </div>
        </div>
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
            className="bg-[#060d18] rounded-xl border border-blue-900/40 shadow-lg max-w-md w-full p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-blue-100">Generate {aiType === "image" ? "Image" : "Content"}</h3>
              <button onClick={() => setAiModalOpen(false)} className="text-blue-400/60 hover:text-blue-300"><X className="w-4 h-4" /></button>
            </div>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe what you want..."
              rows={3}
              className="w-full bg-[#050a14] border border-blue-900/40 rounded text-xs text-blue-100 placeholder-blue-400/30 p-2 outline-none focus:border-blue-500"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAiModalOpen(false)} disabled={aiLoading} className="flex-1 h-8 text-xs">Cancel</Button>
              <Button onClick={handleAIGenerate} disabled={aiLoading} className="flex-1 h-8 text-xs gap-1">{aiLoading ? "..." : "Generate"}</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}