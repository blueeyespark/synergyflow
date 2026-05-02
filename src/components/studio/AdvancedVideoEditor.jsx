import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Download, Trash2, Play, Pause, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import AIContentTools from "./AIContentTools";
import AdvancedVideoEditorSettings from "./AdvancedVideoEditorSettings";
import VideoPreview from "./editor/VideoPreview";
import Timeline from "./editor/Timeline";
import QuickControls from "./editor/QuickControls";
import AdvancedControls from "./editor/AdvancedControls";
import MediaPanel from "./editor/MediaPanel";
import EffectsPanel from "./editor/EffectsPanel";

const presets = [
  { name: "YouTube", width: 1280, height: 720, ratio: "16:9" },
  { name: "Square", width: 1080, height: 1080, ratio: "1:1" },
  { name: "Vertical", width: 1080, height: 1920, ratio: "9:16" },
];

const textAnimations = [
  { id: "fade-in", name: "Fade In" },
  { id: "slide-left", name: "Slide Left" },
  { id: "slide-right", name: "Slide Right" },
  { id: "bounce", name: "Bounce" },
  { id: "scale", name: "Scale" },
  { id: "pop", name: "Pop" },
];

const filterPresets = [
  { id: "none", name: "None", filters: {} },
  { id: "vintage", name: "Vintage", filters: { sepia: 30, saturation: 0.8 } },
  { id: "noir", name: "B&W", filters: { grayscale: 100, contrast: 1.2 } },
  { id: "cool", name: "Cool", filters: { hue: -10, saturation: 1.1 } },
  { id: "warm", name: "Warm", filters: { hue: 20, saturation: 1.1 } },
  { id: "vibrant", name: "Vibrant", filters: { saturation: 1.4, contrast: 1.1 } },
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
  const [hue, setHue] = useState(0);
  const [blur, setBlur] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [opacity, setOpacity] = useState(100);
  const [speed, setSpeed] = useState(1);
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
  const [preset, setPreset] = useState(presets[0]);
  const [bgColor, setBgColor] = useState("#FF6B6B");
  const [mainText, setMainText] = useState("AWESOME VIDEO");
  const [fontSize, setFontSize] = useState(60);
  const [uploadedImage, setUploadedImage] = useState(null);

  const canvasRef = useRef(null);
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

  const filteredMedia = mediaAssets.filter(m => m.name?.toLowerCase().includes(searchMedia.toLowerCase()));

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
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleSeek = (newTime, ref) => {
    if (ref.current) ref.current.currentTime = newTime;
    setCurrentTime(newTime);
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

  const filterStyle = (() => {
    const f = filterPresets.find(p => p.id === selectedFilter);
    if (!f || !video) return {};
    return {
      filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${f.filters.sepia || 0}%) grayscale(${f.filters.grayscale || 0}%) hue-rotate(${hue}deg) blur(${blur}px) opacity(${opacity}%)`,
      transform: `rotate(${rotation}deg) scaleX(${speed < 0 ? -1 : 1})`,
    };
  })();

  return (
    <div className="flex h-[calc(100vh-120px)] bg-gradient-to-br from-[#0a0e27] to-[#050a14] text-white gap-0 rounded-2xl overflow-hidden border border-blue-900/60 shadow-2xl">
      {/* LEFT SIDEBAR - Media & Effects */}
      <div className="w-56 border-r border-blue-900/50 flex flex-col bg-gradient-to-b from-[#0d1628] to-[#050a14] overflow-hidden">
        <div className="flex gap-1 p-2.5 border-b border-blue-900/50 bg-gradient-to-r from-blue-950/40 to-transparent">
          <button onClick={() => setActiveTab("media")} className={`flex-1 px-2 py-1.5 text-xs rounded-lg font-semibold transition-all ${activeTab === "media" ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20" : "text-blue-300/70 hover:bg-blue-900/30 border border-blue-900/30"}`}>📁 Media</button>
          <button onClick={() => setActiveTab("effects")} className={`flex-1 px-2 py-1.5 text-xs rounded-lg font-semibold transition-all ${activeTab === "effects" ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/20" : "text-blue-300/70 hover:bg-blue-900/30 border border-blue-900/30"}`}>✨ Effects</button>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
          {activeTab === "media" && (
            <MediaPanel mediaAssets={mediaAssets} searchMedia={searchMedia} onSearchChange={setSearchMedia} onVideoUpload={handleVideoUpload} filteredMedia={filteredMedia} />
          )}
          {activeTab === "effects" && (
            <EffectsPanel selectedTransition={selectedTransition} selectedFilter={selectedFilter} onTransitionChange={setSelectedTransition} onFilterChange={setSelectedFilter} />
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
        <VideoPreview video={video} isPlaying={isPlaying} onPlay={handlePlay} filterStyle={filterStyle} onVideoRef={videoRef} onLoadedMetadata={handleLoadedMetadata} onTimeUpdate={handleTimeUpdate} />

        {/* Timeline */}
        <Timeline video={video} currentTime={currentTime} duration={duration} onSeek={handleSeek} videoRef={videoRef} />
      </div>

      {/* RIGHT SIDEBAR - Controls & Tools */}
      <div className="w-96 border-l border-blue-900/50 flex flex-col bg-gradient-to-b from-[#0d1628] to-[#050a14] overflow-y-auto">
        <div className="p-2.5 border-b border-blue-900/50 bg-gradient-to-r from-blue-950/40 to-transparent">
          <h3 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">⚙️ Controls</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-sm">
          {/* Quick Controls Section */}
          <div>
            <h4 className="text-xs font-bold text-cyan-300 mb-2">Quick Controls</h4>
            <QuickControls 
              brightness={brightness} contrast={contrast} saturation={saturation} volume={volume} 
              startTime={startTime} endTime={endTime} duration={duration} video={video}
              onBrightness={setBrightness} onContrast={setContrast} onSaturation={setSaturation} 
              onVolume={setVolume} onStartTime={setStartTime} onEndTime={setEndTime}
            />
          </div>

          {/* Advanced Settings */}
          <div className="border-t border-blue-900/40 pt-3">
            <h4 className="text-xs font-bold text-blue-300 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Advanced Settings
            </h4>
            <AdvancedVideoEditorSettings onSettingChange={(id, value) => {}} />
          </div>

          {/* Text Overlay */}
          <div className="border-t border-blue-900/40 pt-3">
            <h4 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">📝 Text Overlay</h4>
            <div className="mt-2 space-y-2">
              <input value={textOverlay} onChange={(e) => setTextOverlay(e.target.value)} placeholder="Add text..." className="w-full h-7 text-xs rounded-lg px-2 bg-blue-950/40 border border-blue-900/40 focus:border-blue-600 text-white outline-none" />
              <div>
                <label className="text-xs font-semibold text-purple-300 block mb-1">Size: {textSize}px</label>
                <input type="range" min="12" max="72" value={textSize} onChange={(e) => setTextSize(parseInt(e.target.value))} className="w-full h-1.5 rounded-full" />
              </div>
            </div>
          </div>

          {/* Thumbnail Creator */}
          <div className="border-t border-blue-900/40 pt-3">
            <h4 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">🎬 Thumbnail</h4>
            <div className="mt-2 space-y-2">
              <div className="bg-gradient-to-b from-blue-950/40 to-purple-950/20 rounded-lg p-1.5 border border-blue-900/30 shadow-inner">
                <canvas ref={canvasRef} className="w-full rounded border border-blue-900/40" style={{ maxHeight: "80px" }} />
              </div>
              <select className="w-full bg-blue-950/40 border border-blue-900/40 rounded-lg text-xs p-1.5 text-blue-100 font-medium outline-none">
                {presets.map(p => (
                  <option key={p.name} value={p.name}>{p.name} ({p.ratio})</option>
                ))}
              </select>
              <Button onClick={handleDownloadThumbnail} className="w-full h-7 text-xs gap-1 bg-gradient-to-r from-cyan-600 to-pink-600 hover:from-cyan-500 hover:to-pink-500 rounded-lg font-semibold shadow-lg shadow-cyan-500/20"><Download className="w-3 h-3" /> Download</Button>
            </div>
          </div>

          {/* Advanced Color & Transform */}
          <div className="border-t border-blue-900/40 pt-3">
            <AdvancedControls 
              hue={hue} blur={blur} opacity={opacity} rotation={rotation} speed={speed}
              onHue={setHue} onBlur={setBlur} onOpacity={setOpacity} onRotation={setRotation} onSpeed={setSpeed}
            />
          </div>

          {/* AI Tools */}
          <div className="border-t border-blue-900/40 pt-3">
            <h4 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">🤖 AI Tools</h4>
            <Button onClick={() => { setAiType("image"); setAiModalOpen(true); }} className="w-full h-7 text-xs gap-1 mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-semibold shadow-lg shadow-purple-500/20"><Sparkles className="w-3 h-3" /> Generate Image</Button>
            <div className="bg-purple-950/20 rounded-lg p-2 border border-purple-900/30 space-y-2 mt-2">
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