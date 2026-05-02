import { Upload, Search, FileVideo, Folder } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function MediaPanel({ mediaAssets, searchMedia, onSearchChange, onVideoUpload, filteredMedia }) {
  return (
    <>
      <label className="flex flex-col items-center justify-center p-2 border-2 border-dashed border-blue-900/40 rounded-lg cursor-pointer hover:border-blue-600/60 transition-colors">
        <Upload className="w-4 h-4 text-blue-400/60 mb-0.5" />
        <p className="text-xs text-center text-blue-400/60">Upload</p>
        <input type="file" accept="video/*,image/*,audio/*" onChange={onVideoUpload} className="hidden" />
      </label>
      <div className="relative">
        <Search className="absolute left-2 top-1.5 w-3 h-3 text-blue-400/40" />
        <Input
          placeholder="Search..."
          value={searchMedia}
          onChange={(e) => onSearchChange(e.target.value)}
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
  );
}