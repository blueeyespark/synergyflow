import { useState } from "react";
import { Scissors, Copy, Check, Play, Clock, Eye, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

function formatDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const DEMO_CLIPS = [
  { id: "c1", title: "Insane Play at 12:34", start: 754, duration: 30, views: 2341, thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=170&fit=crop", created: "2 days ago" },
  { id: "c2", title: "Funny Moment Clip", start: 1823, duration: 60, views: 891, thumbnail: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=300&h=170&fit=crop", created: "5 days ago" },
  { id: "c3", title: "Epic Win", start: 3301, duration: 45, views: 5102, thumbnail: "https://images.unsplash.com/photo-1547394765-185e1e68f34e?w=300&h=170&fit=crop", created: "1 week ago" },
];

export default function ClipsMaker({ video, isViewer = true }) {
  const [clips, setClips] = useState(DEMO_CLIPS);
  const [creating, setCreating] = useState(false);
  const [newClip, setNewClip] = useState({ title: "", start: 0, duration: 30 });
  const [copied, setCopied] = useState(null);

  const createClip = () => {
    if (!newClip.title.trim()) { toast.error("Add a title"); return; }
    const clip = {
      id: `c${Date.now()}`,
      ...newClip,
      views: 0,
      thumbnail: video?.thumbnail_url || "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=300&h=170&fit=crop",
      created: "just now",
    };
    setClips(prev => [clip, ...prev]);
    setCreating(false);
    setNewClip({ title: "", start: 0, duration: 30 });
    toast.success("Clip created!");
  };

  const copyLink = (id) => {
    navigator.clipboard.writeText(`${window.location.origin}/clip/${id}`);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Clip link copied!");
  };

  const deleteClip = (id) => {
    setClips(prev => prev.filter(c => c.id !== id));
    toast.success("Clip deleted");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Clips ({clips.length})</h3>
        </div>
        {isViewer && (
          <button onClick={() => setCreating(!creating)}
            className="flex items-center gap-1 bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity">
            <Plus className="w-3 h-3" /> Create Clip
          </button>
        )}
      </div>

      {creating && (
        <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 mb-4 space-y-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Create New Clip</p>
          <input value={newClip.title} onChange={e => setNewClip(p => ({ ...p, title: e.target.value }))} placeholder="Clip title" className="w-full bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 border border-gray-200 dark:border-zinc-600 outline-none" />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500 dark:text-zinc-400 mb-1 block">Start (seconds)</label>
              <input type="number" value={newClip.start} onChange={e => setNewClip(p => ({ ...p, start: +e.target.value }))} className="w-full bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 border border-gray-200 dark:border-zinc-600 outline-none" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 dark:text-zinc-400 mb-1 block">Duration</label>
              <select value={newClip.duration} onChange={e => setNewClip(p => ({ ...p, duration: +e.target.value }))} className="w-full bg-white dark:bg-zinc-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 border border-gray-200 dark:border-zinc-600 outline-none">
                <option value={30}>30s</option>
                <option value={60}>60s</option>
                <option value={90}>90s</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCreating(false)} className="flex-1 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-white text-sm font-semibold py-2 rounded-lg">Cancel</button>
            <button onClick={createClip} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
              <Scissors className="w-3.5 h-3.5" /> Create Clip
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {clips.map((clip, i) => (
          <motion.div key={clip.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="group bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:border-gray-300 dark:hover:border-zinc-700 transition-colors">
            <div className="relative aspect-video">
              <img src={clip.thumbnail} alt={clip.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-black/60 rounded-full p-2">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
              </div>
              <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-mono">
                {formatDuration(clip.duration)}
              </span>
            </div>
            <div className="p-3">
              <p className="text-gray-900 dark:text-white text-xs font-semibold line-clamp-1 mb-1">{clip.title}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-gray-400 dark:text-zinc-500 text-xs">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{clip.views.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{clip.created}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => copyLink(clip.id)} className="p-1 text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-white transition-colors">
                    {copied === clip.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => deleteClip(clip.id)} className="p-1 text-gray-400 dark:text-zinc-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}