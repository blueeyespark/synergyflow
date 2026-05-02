import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, TrendingUp, Heart, Play, BarChart } from "lucide-react";

export default function AnalyticsPlus() {
  const [user, setUser] = useState(null);
  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: videos = [] } = useQuery({
    queryKey: ["videos-discovery"],
    queryFn: () => base44.entities.Video.list("-created_date", 40),
  });

  const { data: channels = [] } = useQuery({
    queryKey: ["channels-discovery"],
    queryFn: () => base44.entities.Channel.list(),
  });

  const channelMap = channels.reduce((acc, c) => { acc[c.id] = c; return acc; }, {});

  const trending = videos.sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 8);
  const recent = videos.filter(v => v.status === "ready").slice(0, 6);
  const recommendations = videos
    .filter(v => v.status === "ready" && v.view_count < 1000)
    .slice(0, 8);

  const topVideos = videos
    .filter(v => v.status === "ready")
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Trending Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-orange-400" />
          <h2 className="text-xl font-black text-[#e8f4ff]">Trending Now</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {trending.map((v, i) => (
            <div key={v.id} className="group rounded-xl overflow-hidden cursor-pointer">
              <div className="relative aspect-video bg-[#050a14] overflow-hidden">
                <img
                  src={v.thumbnail_url || `https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=300&h=170&fit=crop&sig=${v.id}`}
                  alt={v.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">#{i + 1}</div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="white" />
                </div>
              </div>
              <div className="p-2 bg-[#060d18] border border-blue-900/40">
                <p className="text-xs font-semibold text-[#c8dff5] line-clamp-2">{v.title}</p>
                <p className="text-xs text-blue-400/60 mt-1">{(v.view_count || 0).toLocaleString()} views</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Published */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Play className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-black text-[#e8f4ff]">Recently Published</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recent.map(v => (
            <div key={v.id} className="group rounded-xl overflow-hidden cursor-pointer">
              <div className="relative aspect-video bg-[#050a14] overflow-hidden">
                <img
                  src={v.thumbnail_url || `https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=225&fit=crop&sig=${v.id}`}
                  alt={v.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="p-3 bg-[#060d18] border border-blue-900/40">
                <p className="text-sm font-semibold text-[#c8dff5] line-clamp-2 mb-2">{v.title}</p>
                <div className="flex items-center gap-4 text-xs text-blue-400/60">
                  <span className="flex items-center gap-1"><Play className="w-3 h-3" /> {(v.view_count || 0).toLocaleString()}</span>
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {(v.like_count || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top Performing Videos (Deep Dive) */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BarChart className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-black text-[#e8f4ff]">Top Performing Videos</h2>
        </div>
        <div className="space-y-2">
          {topVideos.map((v, i) => {
            const channel = channelMap[v.channel_id];
            const engagement = ((v.like_count || 0) + (v.comment_count || 0)) / Math.max(v.view_count || 1, 1);
            return (
              <div key={v.id} className="p-4 bg-[#060d18] border border-blue-900/40 rounded-lg hover:border-purple-600/40 transition-colors">
                <div className="flex gap-3 mb-2">
                  <span className="text-sm font-bold text-purple-400">#{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#c8dff5]">{v.title}</p>
                    <p className="text-xs text-blue-400/60">{channel?.channel_name || "Creator"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div><p className="text-blue-400/50">Views</p><p className="text-[#1e78ff] font-bold">{(v.view_count || 0).toLocaleString()}</p></div>
                  <div><p className="text-blue-400/50">Likes</p><p className="text-green-400 font-bold">{(v.like_count || 0).toLocaleString()}</p></div>
                  <div><p className="text-blue-400/50">Comments</p><p className="text-[#a855f7] font-bold">{(v.comment_count || 0).toLocaleString()}</p></div>
                  <div><p className="text-blue-400/50">Engagement</p><p className="text-orange-400 font-bold">{(engagement * 100).toFixed(1)}%</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Hidden Gems (Discovery/Growth Potential) */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-black text-[#e8f4ff]">Hidden Gems (Growth Potential)</h2>
        </div>
        <div className="space-y-3">
          {recommendations.map(v => {
            const channel = channelMap[v.channel_id];
            return (
              <div key={v.id} className="flex gap-3 p-3 rounded-lg bg-[#060d18] border border-blue-900/40 hover:border-purple-600/40 transition-colors cursor-pointer">
                <img
                  src={v.thumbnail_url || `https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=80&h=45&fit=crop&sig=${v.id}`}
                  alt={v.title}
                  className="w-24 h-14 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#c8dff5] line-clamp-2">{v.title}</p>
                  <p className="text-xs text-blue-400/60 mt-1">{channel?.channel_name || "Creator"}</p>
                  <div className="flex items-center gap-3 text-xs text-blue-400/50 mt-1">
                    <span>{(v.view_count || 0).toLocaleString()} views</span>
                    <span>{(v.like_count || 0)} likes</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}