import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Radio, Eye, Users, Heart, Settings, ChevronLeft, Star, Zap, Home } from "lucide-react";
import { motion } from "framer-motion";
import LiveChat from "@/components/live/LiveChat";
import ChannelPoints from "@/components/live/ChannelPoints";
import HypeTrain from "@/components/live/HypeTrain";
import Predictions from "@/components/live/Predictions";
import StreamGoals from "@/components/live/StreamGoals";
import RaidWidget from "@/components/live/RaidWidget";
import { Link } from "react-router-dom";



const CATEGORIES = ["All", "Gaming", "Art", "Tech", "IRL", "Music", "Sports"];

function formatViews(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function LivePage() {
  const [selectedStream, setSelectedStream] = useState(null);
  const [user, setUser] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activePanel, setActivePanel] = useState("chat");

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: channels = [] } = useQuery({
    queryKey: ["channels-all"],
    queryFn: () => base44.entities.Channel.list(),
    staleTime: 5 * 60 * 1000,
  });

  const liveChannels = channels.filter(c => c.is_live);
  const streams = liveChannels.map(c => ({ id: c.id, title: c.description || `${c.channel_name} is live!`, channel: c.channel_name, viewers: Math.floor(Math.random() * 5000) + 100, category: c.categories?.[0] || "IRL", thumbnail: c.banner_url, avatar_color: "from-indigo-500 to-purple-600" }));

  const filtered = activeCategory === "All" ? streams : streams.filter(s => s.category === activeCategory);

  if (selectedStream) {
    return (
      <div className="min-h-screen bg-background dark:bg-zinc-950 text-foreground dark:text-white flex flex-col">
        {/* Back nav */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <button onClick={() => setSelectedStream(null)} className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" /> Back to Browse
          </button>
          <Link to="/" className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors text-sm ml-1">
            <Home className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1 bg-red-600/20 border border-red-500/40 rounded-full px-2.5 py-1">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 text-xs font-bold">LIVE</span>
            </div>
            <span className="flex items-center gap-1 text-zinc-300 text-xs"><Eye className="w-3.5 h-3.5" />{formatViews(selectedStream.viewers)}</span>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Main content */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Stream player */}
            <div className="aspect-video bg-black relative">
              <img src={selectedStream.thumbnail || `https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=450&fit=crop`} alt={selectedStream.title} className="w-full h-full object-cover opacity-90" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/50 rounded-full p-5">
                  <Radio className="w-10 h-10 text-red-500 animate-pulse" />
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div>
                  <p className="text-white font-bold text-lg drop-shadow-lg">{selectedStream.title}</p>
                  <p className="text-white/80 text-sm">{selectedStream.channel} · {selectedStream.category}</p>
                </div>
              </div>
            </div>

            {/* Stream info */}
            <div className="p-4 border-b border-zinc-800 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${selectedStream.avatar_color} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                {selectedStream.channel?.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">{selectedStream.channel}</p>
                <p className="text-zinc-400 text-sm">{selectedStream.category}</p>
              </div>
              <button className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                <Heart className="w-4 h-4" /> Follow
              </button>
            </div>

            {/* Panel tabs */}
            <div className="flex border-b border-zinc-800 bg-zinc-900">
              {[
                { id: "chat", label: "Live Chat" },
                { id: "goals", label: "Goals" },
                { id: "predictions", label: "Predictions" },
                { id: "points", label: "Points" },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActivePanel(tab.id)}
                  className={`px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 ${activePanel === tab.id ? "border-purple-500 text-purple-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {activePanel === "chat" && <LiveChat streamId={selectedStream.id} user={user} />}
              {activePanel === "goals" && <StreamGoals isStreamer={false} />}
              {activePanel === "predictions" && <Predictions isStreamer={false} />}
              {activePanel === "points" && <ChannelPoints channelId={selectedStream.id} />}
            </div>
          </div>

          {/* Right panel — desktop */}
          <div className="hidden lg:flex flex-col w-80 border-l border-zinc-800 overflow-y-auto">
            <div className="p-4 space-y-4">
              <HypeTrain />
              <ChannelPoints channelId={selectedStream.id} />
              <Predictions isStreamer={false} />
              <StreamGoals isStreamer={false} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
           <Link to="/" className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-white transition-colors text-sm mr-1">
            <ChevronLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground dark:text-white">Browse Live</h1>
          <div className="flex items-center gap-1 bg-red-600/20 border border-red-500/30 rounded-full px-2.5 py-1 ml-2">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-xs font-semibold">{streams.length} Live</span>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeCategory === cat ? "bg-purple-600 text-white" : "bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-zinc-700"}`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((stream, i) => (
            <motion.div key={stream.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedStream(stream)}
              className="group cursor-pointer bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:border-slate-300 dark:hover:border-zinc-600 transition-all hover:-translate-y-1">
              <div className="relative aspect-video">
                <img src={stream.thumbnail || `https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=225&fit=crop&sig=${stream.id}`} alt={stream.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 rounded-full px-2 py-0.5">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  <span className="text-white text-xs font-bold">LIVE</span>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                  <Eye className="w-3 h-3" />{formatViews(stream.viewers)}
                </div>
              </div>
              <div className="p-3 flex gap-3">
               <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${stream.avatar_color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                 {stream.channel?.charAt(0)}
               </div>
               <div className="min-w-0">
                 <p className="text-foreground dark:text-white text-sm font-semibold line-clamp-1">{stream.title}</p>
                 <p className="text-slate-500 dark:text-zinc-400 text-xs">{stream.channel}</p>
                 <span className="text-xs bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 px-1.5 py-0.5 rounded mt-1 inline-block">{stream.category}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Radio className="w-12 h-12 text-slate-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-zinc-400 font-semibold">No live streams in this category</p>
            <p className="text-slate-500 dark:text-zinc-600 text-sm mt-1">Start a stream from Creator Studio</p>
          </div>
        )}
      </div>
    </div>
  );
}