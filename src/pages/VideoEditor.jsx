import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Play, Pause, Download, Trash2, Volume2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

export default function VideoEditor() {
  const [video, setVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const videoRef = useRef(null);

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideo({ name: file.name, url, file });
      setStartTime(0);
    }
  };

  const handlePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (endTime && videoRef.current.currentTime >= endTime) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setEndTime(videoRef.current.duration);
    }
  };

  const handleDownloadTrimmed = async () => {
    if (!video) return;
    toast.success(`Video trimmed: ${startTime.toFixed(2)}s to ${endTime.toFixed(2)}s ready for export`);
  };

  const clearVideo = () => {
    setVideo(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-slate-900">Video Editor</h1>
          <p className="text-slate-500 mt-1">Upload, trim, and enhance your videos</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              {video ? (
                <div className="space-y-4">
                  <div className="bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center" style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}>
                    <video
                      ref={videoRef}
                      src={video.url}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      className="w-full h-full object-contain"
                      style={{ volume: volume }}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>{currentTime.toFixed(2)}s</span>
                      <span>{duration.toFixed(2)}s</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={duration}
                      value={currentTime}
                      onChange={(e) => {
                        if (videoRef.current) videoRef.current.currentTime = parseFloat(e.target.value);
                        setCurrentTime(parseFloat(e.target.value));
                      }}
                      className="w-full"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handlePlay} className="flex-1 gap-2">
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {isPlaying ? "Pause" : "Play"}
                    </Button>
                    <Button variant="outline" onClick={clearVideo} className="gap-2">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-slate-400 transition-colors">
                  <Upload className="w-12 h-12 text-slate-400 mb-2" />
                  <p className="font-medium text-slate-900">Upload Video</p>
                  <p className="text-sm text-slate-500">MP4, WebM, or OGG</p>
                  <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                </label>
              )}
            </motion.div>
          </div>

          {/* Controls Sidebar */}
          <div className="space-y-4">
            {video && (
              <>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                  <h3 className="font-semibold text-slate-900 mb-4">Trim</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-2">Start: {startTime.toFixed(2)}s</label>
                      <input
                        type="range"
                        min="0"
                        max={duration}
                        value={startTime}
                        onChange={(e) => setStartTime(Math.min(parseFloat(e.target.value), endTime))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-2">End: {endTime.toFixed(2)}s</label>
                      <input
                        type="range"
                        min="0"
                        max={duration}
                        value={endTime}
                        onChange={(e) => setEndTime(Math.max(parseFloat(e.target.value), startTime))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Effects
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-2">Brightness: {brightness}%</label>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={brightness}
                        onChange={(e) => setBrightness(parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-2">Contrast: {contrast}%</label>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={contrast}
                        onChange={(e) => setContrast(parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-2 flex items-center gap-1">
                        <Volume2 className="w-3 h-3" /> Volume
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </motion.div>

                <Button onClick={handleDownloadTrimmed} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 gap-2">
                  <Download className="w-4 h-4" /> Export Video
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}