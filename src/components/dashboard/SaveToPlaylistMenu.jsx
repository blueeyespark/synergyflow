import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { ListVideo, Plus, Check, Loader2 } from "lucide-react";

export default function SaveToPlaylistMenu({ videoId, userEmail, onClose }) {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saved, setSaved] = useState({});
  const ref = useRef(null);

  useEffect(() => {
    if (!userEmail) return;
    base44.entities.Playlist.filter({ owner_email: userEmail })
      .then(data => {
        setPlaylists(data);
        const s = {};
        data.forEach(p => { if (p.video_ids?.includes(videoId)) s[p.id] = true; });
        setSaved(s);
      })
      .finally(() => setLoading(false));
  }, [videoId, userEmail]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const toggle = async (playlist) => {
    const alreadySaved = saved[playlist.id];
    const newIds = alreadySaved
      ? (playlist.video_ids || []).filter(id => id !== videoId)
      : [...(playlist.video_ids || []), videoId];
    await base44.entities.Playlist.update(playlist.id, { video_ids: newIds });
    setPlaylists(prev => prev.map(p => p.id === playlist.id ? { ...p, video_ids: newIds } : p));
    setSaved(prev => ({ ...prev, [playlist.id]: !alreadySaved }));
  };

  const createAndSave = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const pl = await base44.entities.Playlist.create({
      name: newName.trim(),
      owner_email: userEmail,
      video_ids: [videoId],
    });
    setPlaylists(prev => [...prev, pl]);
    setSaved(prev => ({ ...prev, [pl.id]: true }));
    setNewName("");
    setCreating(false);
  };

  return (
    <div ref={ref} className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-xl w-56 py-2 text-sm">
      <p className="px-3 py-1 text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Save to playlist</p>
      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
      ) : (
        <>
          {playlists.map(p => (
            <button key={p.id} onClick={() => toggle(p)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-left">
              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${saved[p.id] ? "bg-cyan-500 border-cyan-500" : "border-gray-300 dark:border-zinc-600"}`}>
                {saved[p.id] && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="truncate text-gray-700 dark:text-zinc-300">{p.name}</span>
              <span className="text-xs text-gray-400 dark:text-zinc-500 ml-auto">{p.video_ids?.length || 0}</span>
            </button>
          ))}
          <div className="border-t border-gray-100 dark:border-zinc-800 mt-1 pt-1 px-2">
            <div className="flex gap-1">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createAndSave()}
                placeholder="New playlist..."
                className="flex-1 text-xs bg-gray-100 dark:bg-zinc-800 rounded-lg px-2 py-1.5 outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500"
              />
              <button onClick={createAndSave} disabled={creating || !newName.trim()}
                className="p-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 rounded-lg text-white transition-colors">
                {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}