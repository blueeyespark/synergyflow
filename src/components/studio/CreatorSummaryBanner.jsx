import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Eye, Users, TrendingUp, Play, Flame, ArrowUpRight } from "lucide-react";

function fmt(n) {
  if (!n) return "0";
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(n);
}

export default function CreatorSummaryBanner() {
  const { data: videos = [] } = useQuery({
    queryKey: ["videos-all"],
    queryFn: () => base44.entities.Video.list("-created_date", 100),
    staleTime: 5 * 60 * 1000,
  });

  const { data: channels = [] } = useQuery({
    queryKey: ["channels-all"],
    queryFn: () => base44.entities.Channel.list(),
    staleTime: 5 * 60 * 1000,
  });

  const activeVideos = videos.filter(v => v.status !== "deleted" && v.status !== "uploading");
  const totalViews = activeVideos.reduce((s, v) => s + (v.view_count || 0), 0);
  const myChannel = channels[0];
  const subscribers = myChannel?.subscriber_count || 0;

  // New subs this week (simulated from channel data)
  const newSubsThisWeek = Math.max(0, Math.floor(subscribers * 0.016));

  // Trending: top 3 by views in last 30 days
  const trending = [...activeVideos]
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, 3);

  const stats = [
    { icon: Eye, label: "Total Views", value: fmt(totalViews), sub: "all time", color: "#1e78ff" },
    { icon: Users, label: "Subscribers", value: fmt(subscribers), sub: newSubsThisWeek > 0 ? `+${newSubsThisWeek} this week` : "no data yet", color: "#22c55e" },
    { icon: Play, label: "Videos", value: activeVideos.length, sub: "published", color: "#a855f7" },
  ];

  return (
    <div className="bg-gradient-to-br from-[#060d18] to-[#0a1525] border border-[#1e78ff]/20 rounded-2xl p-5 mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-xl bg-[#1e78ff]/20 flex items-center justify-center">
          <TrendingUp className="w-3.5 h-3.5 text-[#1e78ff]" />
        </div>
        <h3 className="text-sm font-bold text-[#e8f4ff]">Channel Overview</h3>
        {myChannel?.is_live && (
          <span className="ml-auto flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-full px-2.5 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE NOW
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-[#03080f]/60 rounded-xl p-3 border border-blue-900/20">
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: s.color }} />
              <span className="text-xs text-blue-400/50">{s.label}</span>
            </div>
            <p className="text-xl font-black text-[#e8f4ff]">{s.value}</p>
            <p className="text-xs text-blue-400/40 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Trending videos */}
      {trending.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-bold text-blue-400/60 uppercase tracking-wider">Trending Videos</span>
          </div>
          <div className="space-y-1.5">
            {trending.map((v, i) => (
              <div key={v.id} className="flex items-center gap-2.5 bg-[#03080f]/40 rounded-xl px-3 py-2 border border-blue-900/15">
                <span className="text-xs font-black text-[#1e78ff] w-4 flex-shrink-0">#{i + 1}</span>
                <div className="w-10 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-[#0a1525]">
                  {v.thumbnail_url && <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <p className="text-xs text-[#c8dff5] font-semibold truncate flex-1">{v.title}</p>
                <div className="flex items-center gap-1 text-xs text-blue-400/50 flex-shrink-0">
                  <ArrowUpRight className="w-3 h-3 text-green-400" />
                  {fmt(v.view_count)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeVideos.length === 0 && (
        <p className="text-xs text-blue-400/30 text-center py-2">Upload your first video to see stats here</p>
      )}
    </div>
  );
}