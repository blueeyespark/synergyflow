import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Tv, X, Zap, ImageIcon, Upload } from "lucide-react";

// ── Mini Create Form ──────────────────────────────────────────────────────────
function MiniCreateForm({ userEmail, onCreated, onCancel }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) { setError("Name required"); return; }
    setCreating(true);
    setError("");
    const res = await base44.functions.invoke("createChannel", { channel_name: name.trim() });
    if (res.data?.error) { setError(res.data.error); setCreating(false); return; }
    setCreating(false);
    onCreated(res.data?.channel?.id);
  };

  return (
    <div className="px-3 py-3 border-t border-blue-900/30">
      <p className="text-xs font-bold text-[#e8f4ff] mb-2">New Channel</p>
      <input
        autoFocus
        value={name}
        onChange={e => { setName(e.target.value); setError(""); }}
        onKeyDown={e => e.key === "Enter" && handleCreate()}
        placeholder="Channel name..."
        className="w-full bg-[#0a1525] border border-blue-900/40 focus:border-[#1e78ff]/60 rounded-lg px-3 py-1.5 text-xs text-[#c8dff5] placeholder-blue-400/30 outline-none mb-2"
      />
      {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
      <div className="flex gap-2">
        <button onClick={handleCreate} disabled={creating || !name.trim()}
          className="flex-1 flex items-center justify-center gap-1.5 bg-[#1e78ff] hover:bg-[#3d8fff] disabled:opacity-40 text-white text-xs font-bold py-1.5 rounded-lg transition-colors">
          {creating ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="w-3 h-3" />}
          Create
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 text-xs text-blue-400/50 hover:text-blue-300 rounded-lg hover:bg-blue-900/20 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Channel Switcher Dropdown ─────────────────────────────────────────────────
export default function ChannelSwitcher({ user, activeChannelId, onSwitch }) {
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: channels = [] } = useQuery({
    queryKey: ["channels-all"],
    queryFn: () => base44.entities.Channel.list(),
    staleTime: 2 * 60 * 1000,
    enabled: !!user?.email,
  });

  const myChannels = channels.filter(c => c.creator_email === user?.email);
  const activeChannel = myChannels.find(c => c.id === activeChannelId) || myChannels[0];

  const handleSwitch = (channelId) => {
    onSwitch(channelId);
    setOpen(false);
    setShowCreate(false);
  };

  const handleCreated = (newChannelId) => {
    queryClient.invalidateQueries({ queryKey: ["channels-all"] });
    setShowCreate(false);
    if (newChannelId) {
      onSwitch(newChannelId);
    }
    setOpen(false);
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Trigger — shows active channel or "My Channels" */}
      <button
        onClick={() => { setOpen(!open); setShowCreate(false); }}
        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-blue-300/70 hover:bg-blue-900/20 hover:text-blue-200 transition-colors"
      >
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#1e78ff] to-[#a855f7] flex items-center justify-center text-white text-xs font-black flex-shrink-0 overflow-hidden">
          {activeChannel?.avatar_url
            ? <img src={activeChannel.avatar_url} className="w-full h-full object-cover" alt="" />
            : activeChannel?.channel_name?.charAt(0) || <Tv className="w-3 h-3" />
          }
        </div>
        <span className="flex-1 text-left truncate">{activeChannel?.channel_name || "My Channels"}</span>
        <svg className={`w-3 h-3 text-blue-400/40 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.1 }}
            className="absolute left-0 right-0 z-50 bg-[#060d18] border border-blue-900/40 rounded-xl shadow-2xl shadow-black/60 overflow-hidden mt-0.5"
          >
            {/* Channel list */}
            <div className="py-1 max-h-56 overflow-y-auto">
              {myChannels.length === 0 ? (
                <p className="text-xs text-blue-400/30 px-3 py-2">No channels yet</p>
              ) : myChannels.map(ch => (
                <button key={ch.id} onClick={() => handleSwitch(ch.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-blue-900/20 transition-colors text-left">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1e78ff] to-[#a855f7] flex items-center justify-center text-white text-xs font-black flex-shrink-0 overflow-hidden">
                    {ch.avatar_url
                      ? <img src={ch.avatar_url} className="w-full h-full object-cover" alt="" />
                      : ch.channel_name?.charAt(0)
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#c8dff5] truncate">{ch.channel_name}</p>
                    <p className="text-xs text-blue-400/30">{ch.subscriber_count || 0} subscribers</p>
                  </div>
                  {ch.id === activeChannel?.id && <Check className="w-3.5 h-3.5 text-[#1e78ff] flex-shrink-0" />}
                </button>
              ))}
            </div>

            {/* Add new channel */}
            {!showCreate ? (
              <div className="border-t border-blue-900/30 py-1">
                <button onClick={() => setShowCreate(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-blue-900/20 transition-colors text-[#1e78ff] text-xs font-semibold">
                  <Plus className="w-3.5 h-3.5" /> Add a new channel
                </button>
              </div>
            ) : (
              <MiniCreateForm userEmail={user.email} onCreated={handleCreated} onCancel={() => setShowCreate(false)} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}