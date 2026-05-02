import { useState } from "react";
import { Zap, Search, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function RaidButton({ channel, user }) {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { data: channels = [] } = useQuery({
    queryKey: ["channels-for-raid"],
    queryFn: () => base44.entities.Channel.list(),
  });

  const filteredChannels = channels.filter(
    c =>
      c.id !== channel?.id &&
      (c.channel_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.creator_email.includes(searchQuery))
  ).slice(0, 8);

  const handleRaid = async () => {
    if (!selectedChannel) {
      setError("Please select a channel");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const raid = await base44.entities.Raid.create({
        from_channel_id: channel.id,
        to_channel_id: selectedChannel.id,
        viewer_count: Math.floor(Math.random() * 500) + 50, // Mock viewer count
        message: message.trim(),
        status: "pending",
      });

      setSelectedChannel(null);
      setMessage("");
      setShowModal(false);
    } catch (err) {
      setError(err.message || "Raid failed");
    } finally {
      setLoading(false);
    }
  };

  if (!user || !channel) return null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-bold px-4 py-2 rounded-full transition-all"
      >
        <Zap className="w-4 h-4" /> Raid
      </button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Raid a Channel</h3>

              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg flex gap-2 text-sm text-red-700 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Find a Channel</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search channels..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              {filteredChannels.length > 0 && (
                <div className="mb-4 max-h-48 overflow-y-auto space-y-2">
                  {filteredChannels.map(ch => (
                    <button
                      key={ch.id}
                      onClick={() => setSelectedChannel(ch)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all ${
                        selectedChannel?.id === ch.id
                          ? "border-purple-400 bg-purple-50 dark:bg-purple-900/20"
                          : "border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {ch.channel_name?.charAt(0)}
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{ch.channel_name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{ch.subscriber_count} subs</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase block mb-2">Message (optional)</label>
                <input
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Come check out this channel!"
                  maxLength={100}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRaid}
                  disabled={loading || !selectedChannel}
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-bold rounded-lg transition-colors"
                >
                  {loading ? "Raiding..." : "Send Raid"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}