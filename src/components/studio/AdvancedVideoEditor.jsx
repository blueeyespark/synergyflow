import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Play, Pause, Download, Trash2, Volume2, Type, Palette, Music, Image, Sparkles, MessageSquare, X, Search, Plus, Folder, FileVideo, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import AIContentTools from "./AIContentTools";

const presets = [
  { name: "YouTube", width: 1280, height: 720, ratio: "16:9" },
  { name: "Square", width: 1080, height: 1080, ratio: "1:1" },
  { name: "Twitter", width: 1024, height: 512, ratio: "2:1" },
  { name: "Vertical", width: 1080, height: 1920, ratio: "9:16" },
];

const introTemplates = [
  { id: 1, name: "Cinematic", bg: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", textColor: "#fff", animation: "slide" },
  { id: 2, name: "Neon", bg: "linear-gradient(135deg, #0f0f1e 0%, #1a0033 100%)", textColor: "#00ffff", animation: "fade" },
  { id: 3, name: "Sunset", bg: "linear-gradient(135deg, #ff6b00 0%, #ff0066 100%)", textColor: "#fff", animation: "zoom" },
  { id: 4, name: "Minimal", bg: "#ffffff", textColor: "#000", animation: "slide" },
  { id: 5, name: "Gaming", bg: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)", textColor: "#00ff00", animation: "bounce" },
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
  const [activePanel, setActivePanel] = useState("media");
  const [searchMedia, setSearchMedia] = useState("");
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiType, setAiType] = useState(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Thumbnail state
  const canvasRef = useRef(null);
  const [preset, setPreset] = useState(presets[0]);
  const [bgColor, setBgColor] = useState("#FF6B6B");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [mainText, setMainText] = useState("AWESOME VIDEO");
  const [fontSize, setFontSize] = useState(60);
  const [uploadedImage, setUploadedImage] = useState(null);

  // Intro/Outro state
  const [selectedTemplate, setSelectedTemplate] = useState(introTemplates[0]);
  const [introText, setIntroText] = useState("Your Channel");
  const [outroText, setOutroText] = useState("Thanks for Watching!");
  const [introFontSize, setIntroFontSize] = useState(48);

  // Music state
  const [music, setMusic] = useState(null);
  const [musicVolume, setMusicVolume] = useState(0.5);

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
      ctx.fillStyle = textColor;
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
  }, [bgColor, textColor, mainText, fontSize, uploadedImage, preset]);

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

  return (
    <div className="flex h-[90vh] bg-[#0a0e27] text-white gap-0 rounded-2xl overflow-hidden border border-blue-900/40">
      {/* LEFT SIDEBAR - Media Library */}
      <div className="w-64 border-r border-blue-900/40 flex flex-col bg-[#060d18]">
        <div className="p-4 border-b border-blue-900/40">
          <h3 className="text-sm font-bold mb-3">Media Library</h3>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-blue-400/40" />
            <Input
              placeholder="Search..."
              value={searchMedia}
              onChange={(e) => setSearchMedia(e.target.value)}
              className="pl-8 h-8 text-xs bg-[#050a14] border-blue-900/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Upload Section */}
          <div>
            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-blue-900/40 rounded-lg cursor-pointer hover:border-blue-600/60 transition-colors">
              <Upload className="w-6 h-6 text-blue-400/60 mb-2" />
              <p className="text-xs text-center text-blue-400/60">Upload Media</p>
              <input type="file" accept="video/*,image/*,audio/*" onChange={handleVideoUpload} className="hidden" />
            </label>
          </div>

          {/* Media Grid */}
          {filteredMedia.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {filteredMedia.slice(0, 8).map(m => (
                <div key={m.id} className="group relative rounded-lg overflow-hidden bg-[#050a14] border border-blue-900/40 hover:border-blue-500/60 transition-colors cursor-pointer">
                  {m.type === "image" && m.url && (
                    <img src={m.url} alt={m.name} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform" />
                  )}
                  {m.type === "video" && (
                    <div className="w-full aspect-square flex items-center justify-center bg-black">
                      <FileVideo className="w-6 h-6 text-blue-400/40" />
                    </div>
                  )}
                  {m.type === "audio" && (
                    <div className="w-full aspect-square flex items-center justify-center bg-[#050a14]">
                      <Music className="w-6 h-6 text-blue-400/40" />
                    </div>
                  )}
                  <p className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">{m.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Folder className="w-8 h-8 text-blue-400/30 mx-auto mb-2" />
              <p className="text-xs text-blue-400/40">No media yet</p>
            </div>
          )}
        </div>
      </div>

      {/* CENTER - Video Preview & Timeline */}
      <div className="flex-1 flex flex-col border-r border-blue-900/40 bg-[#050a14]">
        {/* Top Toolbar */}
        <div className="h-12 border-b border-blue-900/40 flex items-center gap-2 px-4 bg-[#0a0e27]">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Play className="w-4 h-4" /></Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Pause className="w-4 h-4" /></Button>
          <div className="h-6 w-px bg-blue-900/40 mx-1" />
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Type className="w-4 h-4" /></Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Palette className="w-4 h-4" /></Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Volume2 className="w-4 h-4" /></Button>
          <div className="flex-1" />
          <Button size="sm" onClick={handleDownloadVideo} className="gap-2 h-8">
            <Download className="w-3 h-3" /> Export
          </Button>
        </div>

        {/* Video Preview */}
        <div className="flex-1 flex items-center justify-center bg-black relative">
          {video ? (
            <div className="relative w-full h-full flex items-center justify-center" style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}>
              <video
                ref={videoRef}
                src={video.url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30 cursor-pointer" onClick={handlePlay}>
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white" />}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <FileVideo className="w-12 h-12 text-blue-400/30 mx-auto mb-3" />
              <p className="text-sm text-blue-400/50">No video loaded</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        {video && (
          <div className="h-32 border-t border-blue-900/40 bg-[#0a0e27] p-3 space-y-2 overflow-x-auto">
            {/* Time display */}
            <div className="flex justify-between text-xs text-blue-400/60">
              <span>{currentTime.toFixed(2)}s</span>
              <span>{duration.toFixed(2)}s</span>
            </div>

            {/* Progress bar */}
            <div className="relative h-2 bg-[#050a14] rounded-full cursor-pointer group">
              <div
                className="absolute h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
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

            {/* Waveform visualization (placeholder) */}
            <div className="h-16 bg-[#050a14] rounded border border-blue-900/40 flex items-end justify-around p-1 gap-0.5">
              {Array.from({ length: 40 }).map((_, i) => (
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

      {/* RIGHT SIDEBAR - Controls */}
      <div className="w-72 border-l border-blue-900/40 flex flex-col bg-[#060d18] overflow-y-auto">
        {/* Panel Tabs */}
        <div className="flex gap-1 p-2 border-b border-blue-900/40 bg-[#0a0e27]">
          <button onClick={() => setActivePanel("effects")} className={`flex-1 px-3 py-1.5 text-xs rounded font-medium transition-colors ${activePanel === "effects" ? "bg-blue-600 text-white" : "text-blue-400/60 hover:bg-blue-900/20"}`}>Effects</button>
          <button onClick={() => setActivePanel("thumbnail")} className={`flex-1 px-3 py-1.5 text-xs rounded font-medium transition-colors ${activePanel === "thumbnail" ? "bg-blue-600 text-white" : "text-blue-400/60 hover:bg-blue-900/20"}`}>Thumbnail</button>
          <button onClick={() => setActivePanel("intro")} className={`flex-1 px-3 py-1.5 text-xs rounded font-medium transition-colors ${activePanel === "intro" ? "bg-blue-600 text-white" : "text-blue-400/60 hover:bg-blue-900/20"}`}>Intro</button>
          <button onClick={() => setActivePanel("ai")} className={`flex-1 px-3 py-1.5 text-xs rounded font-medium transition-colors ${activePanel === "ai" ? "bg-blue-600 text-white" : "text-blue-400/60 hover:bg-blue-900/20"}`}>AI</button>
        </div>

        {/* Panel Content */}
        <div className="flex-1 p-4 space-y-4">
          {/* Effects Panel */}
          {activePanel === "effects" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-blue-400/60 block mb-2">Brightness: {brightness}%</label>
                <input type="range" min="50" max="150" value={brightness} onChange={(e) => setBrightness(parseFloat(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="text-xs font-medium text-blue-400/60 block mb-2">Contrast: {contrast}%</label>
                <input type="range" min="50" max="150" value={contrast} onChange={(e) => setContrast(parseFloat(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="text-xs font-medium text-blue-400/60 block mb-2">Volume: {(volume * 100).toFixed(0)}%</label>
                <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-full" />
              </div>
              {video && (
                <>
                  <div>
                    <label className="text-xs font-medium text-blue-400/60 block mb-2">Start: {startTime.toFixed(2)}s</label>
                    <input type="range" min="0" max={duration} value={startTime} onChange={(e) => setStartTime(Math.min(parseFloat(e.target.value), endTime))} className="w-full" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-blue-400/60 block mb-2">End: {endTime.toFixed(2)}s</label>
                    <input type="range" min="0" max={duration} value={endTime} onChange={(e) => setEndTime(Math.max(parseFloat(e.target.value), startTime))} className="w-full" />
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Thumbnail Panel */}
          {activePanel === "thumbnail" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="bg-[#050a14] rounded-lg p-2 mb-3">
                <canvas ref={canvasRef} className="w-full rounded border border-blue-900/40" style={{ maxHeight: "150px" }} />
              </div>
              <div>
                <label className="text-xs font-medium text-blue-400/60 block mb-2">Size</label>
                <div className="space-y-2">
                  {presets.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => setPreset(p)}
                      className={`w-full p-2 text-xs rounded border transition-all ${
                        preset.name === p.name ? "border-cyan-500 bg-cyan-900/30 font-medium text-cyan-300" : "border-blue-900/40 text-blue-400/60 hover:border-blue-600/40"
                      }`}
                    >
                      {p.name} ({p.ratio})
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-blue-400/60 block mb-2">Background Color</label>
                <div className="flex gap-2">
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-8 rounded cursor-pointer border border-blue-900/40" />
                  <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="text-xs flex-1 h-8 bg-[#050a14]" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-blue-400/60 block mb-2">Text Color</label>
                <div className="flex gap-2">
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-10 h-8 rounded cursor-pointer border border-blue-900/40" />
                  <Input value={textColor} onChange={(e) => setTextColor(e.target.value)} className="text-xs flex-1 h-8 bg-[#050a14]" />
                </div>
              </div>
              <Input value={mainText} onChange={(e) => setMainText(e.target.value.toUpperCase())} placeholder="Text" className="text-xs h-8 bg-[#050a14]" />
              <div>
                <label className="text-xs font-medium text-blue-400/60 block mb-2">Font Size: {fontSize}px</label>
                <input type="range" min="20" max="100" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full" />
              </div>
              <label className="flex items-center justify-center p-2 border-2 border-dashed border-blue-900/40 rounded cursor-pointer hover:border-blue-600/40 transition-colors">
                <span className="text-xs text-blue-400/60">Upload Image</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              <Button onClick={handleDownloadThumbnail} className="w-full gap-2 h-8 text-xs">
                <Download className="w-3 h-3" /> Download
              </Button>
            </motion.div>
          )}

          {/* Intro Panel */}
          {activePanel === "intro" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {introTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    className={`p-2 rounded border-2 transition-all ${
                      selectedTemplate.id === t.id ? "border-cyan-500 bg-cyan-900/30" : "border-blue-900/40 hover:border-blue-600/40"
                    }`}
                  >
                    <div className="w-full h-6 rounded mb-1" style={{ background: t.bg }} />
                    <p className="text-xs font-medium text-blue-400/60">{t.name}</p>
                  </button>
                ))}
              </div>
              <Input value={introText} onChange={(e) => setIntroText(e.target.value)} placeholder="Intro Text" className="text-xs h-8 bg-[#050a14]" />
              <Input value={outroText} onChange={(e) => setOutroText(e.target.value)} placeholder="Outro Text" className="text-xs h-8 bg-[#050a14]" />
              <div>
                <label className="text-xs font-medium text-blue-400/60 block mb-2">Font Size: {introFontSize}px</label>
                <input type="range" min="24" max="72" value={introFontSize} onChange={(e) => setIntroFontSize(parseInt(e.target.value))} className="w-full" />
              </div>
            </motion.div>
          )}

          {/* AI Panel */}
          {activePanel === "ai" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="grid gap-2">
                {[
                  { id: "image", icon: Image, label: "Generate Image" },
                  { id: "video", icon: MessageSquare, label: "Generate Video" },
                  { id: "music", icon: Music, label: "Generate Music" },
                ].map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => { setAiType(tool.id); setAiModalOpen(true); }}
                    className="p-3 rounded border border-blue-900/40 hover:border-blue-600/40 transition-colors text-left"
                  >
                    <tool.icon className="w-4 h-4 text-blue-400 mb-1" />
                    <p className="text-xs font-medium text-blue-400/60">{tool.label}</p>
                  </button>
                ))}
              </div>
              <div className="pt-3 border-t border-blue-900/40">
                <AIContentTools />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* AI Generation Modal */}
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
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-blue-100">
                Generate {aiType === "image" ? "Image" : aiType === "music" ? "Music" : "Video"}
              </h3>
              <button onClick={() => setAiModalOpen(false)} className="text-blue-400/60 hover:text-blue-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Describe what you want to generate..."
              rows={4}
              className="w-full bg-[#050a14] border border-blue-900/40 rounded-lg p-3 text-sm text-blue-100 placeholder-blue-400/30 outline-none focus:border-blue-500"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAiModalOpen(false)} disabled={aiLoading} className="flex-1 h-9 text-xs">
                Cancel
              </Button>
              <Button onClick={handleAIGenerate} disabled={aiLoading} className="flex-1 gap-2 h-9 text-xs">
                {aiLoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}