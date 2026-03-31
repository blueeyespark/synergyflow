import { useState } from "react";
import { motion } from "framer-motion";
import { Radio, Settings, Eye, Users, Heart, MessageCircle, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function TwitchStreamer() {
  const [isLive, setIsLive] = useState(false);
  const [streamTitle, setStreamTitle] = useState("");
  const [category, setCategory] = useState("Just Chatting");
  const [viewers, setViewers] = useState(0);
  const [likes, setLikes] = useState(0);
  const [streamDuration, setStreamDuration] = useState(0);

  const categories = [
    "Just Chatting",
    "Coding",
    "Gaming",
    "Music",
    "Creative",
    "Art",
    "IRL",
    "Educational",
  ];

  const handleGoLive = () => {
    if (!streamTitle.trim()) {
      toast.error("Stream title is required");
      return;
    }
    setIsLive(true);
    toast.success("🎬 You're now live on Twitch!");

    // Simulate stream stats
    const interval = setInterval(() => {
      setStreamDuration((prev) => prev + 1);
      setViewers(Math.floor(Math.random() * 500) + 10);
      setLikes(Math.floor(Math.random() * 100) + 5);
    }, 3000);

    return () => clearInterval(interval);
  };

  const handleEndStream = () => {
    setIsLive(false);
    setStreamTitle("");
    setStreamDuration(0);
    setViewers(0);
    setLikes(0);
    toast.success("Stream ended. Thanks for watching!");
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {!isLive ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Setup Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" /> Stream Settings
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-900 block mb-2">
                  Stream Title *
                </label>
                <Input
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  placeholder="What are you streaming about?"
                  className="text-lg"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-900 block mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">Stream Requirements</p>
                  <p className="text-xs text-amber-800 mt-1">
                    Min 5 Mbps upload speed recommended for 1080p 60fps
                  </p>
                </div>
              </div>

              <Button
                onClick={handleGoLive}
                disabled={!streamTitle.trim()}
                className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold text-lg gap-2"
              >
                <Radio className="w-5 h-5" /> Go Live
              </Button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          {/* Live Indicator */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
                <div>
                  <p className="text-sm opacity-90">LIVE NOW</p>
                  <p className="text-2xl font-black">{streamTitle}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Duration</p>
                <p className="text-3xl font-black font-mono">{formatDuration(streamDuration)}</p>
              </div>
            </div>
          </div>

          {/* Stream Stats */}
          <div className="grid sm:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-blue-500" />
                <p className="text-sm text-slate-600">Viewers</p>
              </div>
              <p className="text-4xl font-black text-slate-900">{viewers}</p>
              <p className="text-xs text-slate-500 mt-1">current viewers</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-red-500" />
                <p className="text-sm text-slate-600">Likes</p>
              </div>
              <p className="text-4xl font-black text-slate-900">{likes}</p>
              <p className="text-xs text-slate-500 mt-1">this stream</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-5 h-5 text-green-500" />
                <p className="text-sm text-slate-600">Chat Activity</p>
              </div>
              <p className="text-4xl font-black text-slate-900">{Math.floor(viewers / 3)}</p>
              <p className="text-xs text-slate-500 mt-1">messages/min</p>
            </motion.div>
          </div>

          {/* Stream Feed Preview */}
          <div className="bg-black rounded-2xl aspect-video flex items-center justify-center">
            <div className="text-center text-white">
              <TrendingUp className="w-16 h-16 opacity-30 mx-auto mb-4" />
              <p className="text-sm opacity-60">Stream Preview (connect OBS/Streamlabs)</p>
            </div>
          </div>

          {/* End Stream Button */}
          <Button
            onClick={handleEndStream}
            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold text-lg"
          >
            End Stream
          </Button>
        </motion.div>
      )}
    </div>
  );
}