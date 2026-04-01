import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Radio, Eye, Users, Settings, Target, Zap, TrendingUp, Sword, Play, Square } from "lucide-react";
import { motion } from "framer-motion";
import LiveChat from "@/components/live/LiveChat";
import ChannelPoints from "@/components/live/ChannelPoints";
import HypeTrain from "@/components/live/HypeTrain";
import Predictions from "@/components/live/Predictions";
import StreamGoals from "@/components/live/StreamGoals";
import RaidWidget from "@/components/live/RaidWidget";
import { toast } from "sonner";

export default function StreamerDashboard() {
  const [user, setUser] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [streamTitle, setStreamTitle] = useState("My Awesome Stream!");
  const [category, setCategory] = useState("Gaming");
  const [viewers, setViewers] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeTab, setActiveTab] = useState("chat");

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setViewers(v => v + Math.floor(Math.random() * 5) - 1);
      setDuration(d => d + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isLive]);

  const { data: channels = [] } = useQuery({
    queryKey: ["channels-all"],
    queryFn: () => base44.entities.Channel.list(),
    staleTime: 5 * 60 * 1000,
  });

  const myChannel = channels[0];

  const startStream = () => {
    setIsLive(true);
    setViewers(Math.floor(Math.random() * 50) + 10);
    toast.success("🔴 You are now LIVE!");
  };

  const endStream = () => {
    setIsLive(false);
    setViewers(0);
    const mins = Math.floor(duration / 60);
    toast.success(`Stream ended! ${mins} minutes streamed.`);
    setDuration(0);
  };

  const formatDuration = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0 ? `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}` : `${m}:${String(s).padStart(2,"0")}`;
  };

  const CATEGORIES = ["Gaming", "Art", "Music", "IRL", "Tech", "Sports", "Cooking", "Education"];
  const QUICK_ACTIONS = [
    { label: "Ad Break", icon: "📺", action: () => toast.info("Running a 30s ad break") },
    { label: "Slow Chat", icon: "🐢", action: () => toast.success("Slow mode enabled (30s)") },
    { label: "Sub Only", icon: "⭐", action: () => toast.success("Subscriber-only mode on") },
    { label: "Clear Chat", icon: "🗑️", action: () => toast.success("Chat cleared") },
    { label: "Clip It", icon: "✂️", action: () => toast.success("Clip created!") },
    { label: "Host Mode", icon: "📡", action: () => toast.info("Entering host mode") },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Stream Dashboard</h1>
              <p className="text-zinc-400 text-sm">{myChannel?.channel_name || user?.full_name || "Your Channel"}</p>
            </div>
          </div>
          {isLive ? (
            <button onClick={endStream} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2.5 rounded-xl transition-colors">
              <Square className="w-4 h-4 fill-white" /> End Stream
            </button>
          ) : (
            <button onClick={startStream} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-2.5 rounded-xl transition-colors">
              <Play className="w-4 h-4 fill-white" /> Go Live
            </button>
          )}
        </div>

        {/* Live stats */}
        {isLive && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Live Viewers", value: Math.max(0, viewers), icon: Eye, color: "text-red-400" },
              { label: "Duration", value: formatDuration(duration), icon: Radio, color: "text-green-400" },
              { label: "Peak Viewers", value: Math.max(0, viewers + 12), icon: TrendingUp, color: "text-purple-400" },
            ].map((s, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-center">
                <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1`} />
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Stream setup (when offline) */}
        {!isLive && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 mb-6">
            <p className="text-sm font-semibold text-white mb-3">Stream Setup</p>
            <div className="flex gap-3">
              <input value={streamTitle} onChange={e => setStreamTitle(e.target.value)} placeholder="Stream title" className="flex-1 bg-zinc-800 text-white text-sm rounded-lg px-3 py-2 border border-zinc-700 outline-none focus:border-purple-500" />
              <select value={category} onChange={e => setCategory(e.target.value)} className="bg-zinc-800 text-white text-sm rounded-lg px-3 py-2 border border-zinc-700 outline-none">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Quick actions (Stream Deck) */}
        {isLive && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 mb-6">
            <p className="text-sm font-semibold text-zinc-400 mb-3">Stream Deck</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {QUICK_ACTIONS.map(a => (
                <button key={a.label} onClick={a.action} className="flex flex-col items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl p-3 transition-colors active:scale-95">
                  <span className="text-2xl">{a.icon}</span>
                  <span className="text-xs text-zinc-300 font-medium text-center">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Chat + tabs */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-1 border-b border-zinc-800">
              {["chat", "goals", "predictions", "raid"].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-xs font-semibold capitalize transition-colors border-b-2 -mb-px ${activeTab === tab ? "border-purple-500 text-purple-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
                  {tab}
                </button>
              ))}
            </div>
            {activeTab === "chat" && <LiveChat streamId="my-stream" user={user} />}
            {activeTab === "goals" && <StreamGoals isStreamer={true} />}
            {activeTab === "predictions" && <Predictions isStreamer={true} />}
            {activeTab === "raid" && <RaidWidget currentViewers={viewers} channels={[]} />}
          </div>

          {/* Right: Widgets */}
          <div className="space-y-4">
            <HypeTrain onContribute={() => {}} />
            <ChannelPoints channelId={myChannel?.id || "my-channel"} />
          </div>
        </div>
      </div>
    </div>
  );
}