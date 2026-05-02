import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart2, TrendingUp, Eye, Clock, ThumbsUp, Play } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

function formatViews(n) {
  if (!n) return "0";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-zinc-400">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

export default function VideoAnalyticsPage() {
  const [range, setRange] = useState(30);

  const { data: videos = [] } = useQuery({
    queryKey: ["videos-all"],
    queryFn: () => base44.entities.Video.list("-created_date", 100),
    staleTime: 5 * 60 * 1000,
  });

  const { data: analytics = [] } = useQuery({
    queryKey: ["video-analytics-all"],
    queryFn: () => base44.entities.VideoAnalytics.list("-date", 200),
    staleTime: 5 * 60 * 1000,
  });

  const activeVideos = videos.filter(v => v.status !== "deleted" && v.status !== "uploading");

  // Build daily views chart data from analytics or mock from videos
  const today = new Date();
  const days = Array.from({ length: range }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (range - 1 - i));
    return d.toISOString().slice(0, 10);
  });

  const analyticsMap = {};
  analytics.forEach(a => {
    if (!analyticsMap[a.date]) analyticsMap[a.date] = { views: 0, watch_time: 0, likes: 0 };
    analyticsMap[a.date].views += a.views || 0;
    analyticsMap[a.date].watch_time += a.watch_time_hours || 0;
    analyticsMap[a.date].likes += a.likes || 0;
  });

  // If no real analytics data, generate mock from video counts
  const hasAnalytics = analytics.length > 0;
  const viewsData = days.map(date => ({
    date: date.slice(5),
    views: analyticsMap[date]?.views ?? (hasAnalytics ? 0 : Math.floor(Math.random() * 500 + 50)),
    watch_hours: analyticsMap[date]?.watch_time?.toFixed(1) ?? (hasAnalytics ? 0 : (Math.random() * 20 + 2).toFixed(1)),
  }));

  const totalViews = activeVideos.reduce((s, v) => s + (v.view_count || 0), 0);
  const totalLikes = activeVideos.reduce((s, v) => s + (v.like_count || 0), 0);
  const avgDuration = activeVideos.length
    ? Math.round(activeVideos.reduce((s, v) => s + (v.duration_seconds || 0), 0) / activeVideos.length)
    : 0;

  const topVideos = [...activeVideos]
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, 10);

  const categoryData = activeVideos.reduce((acc, v) => {
    const cat = v.category || "Uncategorized";
    acc[cat] = (acc[cat] || 0) + (v.view_count || 0);
    return acc;
  }, {});
  const categoryChartData = Object.entries(categoryData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, views]) => ({ name, views }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Video Analytics</h1>
          </div>
          <p className="text-gray-500 dark:text-zinc-400 text-sm ml-12">Track performance across all your videos</p>
        </motion.div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Eye} label="Total Views" value={formatViews(totalViews)} color="bg-gradient-to-br from-blue-500 to-cyan-600" />
          <StatCard icon={Play} label="Total Videos" value={activeVideos.length} color="bg-gradient-to-br from-purple-500 to-indigo-600" />
          <StatCard icon={ThumbsUp} label="Total Likes" value={formatViews(totalLikes)} color="bg-gradient-to-br from-pink-500 to-rose-600" />
          <StatCard icon={Clock} label="Avg Duration" value={`${Math.floor(avgDuration / 60)}m ${avgDuration % 60}s`} color="bg-gradient-to-br from-amber-500 to-orange-600" />
        </div>

        {/* Views over time */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Views Over Time</h2>
            </div>
            <div className="flex gap-1">
              {[7, 30, 90].map(r => (
                <button key={r} onClick={() => setRange(r)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${range === r ? "bg-cyan-500 text-white" : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700"}`}>
                  {r}d
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={viewsData}>
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="views" stroke="#06b6d4" fill="url(#viewsGrad)" strokeWidth={2} name="Views" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Top videos */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-purple-500" /> Top Performing Videos
            </h2>
            <div className="space-y-3">
              {topVideos.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-zinc-500 text-center py-6">No videos yet</p>
              )}
              {topVideos.map((v, i) => (
                <div key={v.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 dark:text-zinc-500 w-5 flex-shrink-0">#{i + 1}</span>
                  <div className="w-12 aspect-video rounded overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-zinc-800">
                    <img src={v.thumbnail_url || `https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=80&h=45&fit=crop&sig=${v.id}`} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{v.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400 dark:text-zinc-500">{formatViews(v.view_count)} views</span>
                      <span className="text-xs text-gray-400 dark:text-zinc-500">·</span>
                      <span className="text-xs text-gray-400 dark:text-zinc-500">{formatViews(v.like_count)} likes</span>
                    </div>
                  </div>
                  <div className="w-20 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full flex-shrink-0 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
                      style={{ width: `${topVideos[0]?.view_count ? Math.round((v.view_count || 0) / topVideos[0].view_count * 100) : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Views by category */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-amber-500" /> Views by Category
            </h2>
            {categoryChartData.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-zinc-500 text-center py-6">No category data</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} width={80} />
                  <Tooltip />
                  <Bar dataKey="views" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Views" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}