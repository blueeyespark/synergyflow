import { Play, Pause, FileVideo } from "lucide-react";
import { motion } from "framer-motion";

export default function VideoPreview({ video, isPlaying, onPlay, filterStyle, onVideoRef, onLoadedMetadata, onTimeUpdate }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-black relative group overflow-hidden">
      {video ? (
        <div className="relative w-full h-full flex items-center justify-center" style={filterStyle}>
          <video
            ref={onVideoRef}
            src={video.url}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 cursor-pointer" onClick={onPlay}>
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
            </div>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center cursor-pointer hover:opacity-75 transition-opacity w-full h-full">
          <FileVideo className="w-12 h-12 text-blue-400/30 mb-2" />
          <p className="text-xs text-blue-400/50">Click to upload video or drag & drop</p>
          <input type="file" accept="video/*" onChange={(e) => onVideoRef(e)} className="hidden" />
        </label>
      )}
    </div>
  );
}