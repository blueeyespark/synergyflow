import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Eye, Clock, ThumbsUp, MessageSquare, Share2, Users } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";

export default function VideoAnalytics() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: videos = [] } = useQuery({
    queryKey: ["video_performance", user?.email],
    queryFn: () => base44.entities.VideoPerformance.list("-published_date"),
    enabled: !!user?.email,
  });

  const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
  const totalWatchTime = videos.reduce((sum, v) => sum + (v.watch_time_hours || 0), 0);
  const avgEngagement = videos.length > 0 ? (videos.reduce((sum, v) => sum + (v.engagement_rate || 0), 0) / videos.length).toFixed(1) : 0;
  const totalSubscribersGained = videos.reduce((sum, v) => sum + (v.subscribers_gained || 0), 0);

  const platformData = videos.reduce((acc, v) => {
    const existing = acc.find(p => p.name === v.platform);
    if (existing) {
      existing.views += v.views || 0;
      existing.count += 1;
    } else {
      acc.push({ name: v.platform, views: v.views || 0, count: 1 });
    }
    return acc;
  }, []);

  const performanceByVideo = videos.slice(0, 10).map(v => ({
    title: v.video_title.substring(0, 15),
    views: v.views || 0,
    engagement: v.engagement_rate || 0,
    watchTime: v.watch_time_hours || 0,
  }));

  const engagementMetrics = videos.length > 0 ? [
    { name: "Likes", value: videos.reduce((sum, v) => sum + (v.likes || 0), 0) },
    { name: "Comments", value: videos.reduce((sum, v) => sum + (v.comments || 0), 0) },
    { name: "Shares", value: videos.reduce((sum, v) => sum + (v.shares || 0), 0) },
  ] : [];

  const colors = ["#3b82f6", "#ef4444", "#10b981"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-slate-900">Video Analytics</h1>
          <p className="text-slate-500 mt-1">Track your video performance and growth trends</p>
        </motion.div>

        {/* Key Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatsCard title="Total Views" value={totalViews.toLocaleString()} icon={Eye} color="bg-blue-500" />
          <StatsCard title="Watch Time" value={totalWatchTime.toFixed(0)} icon={Clock} color="bg-amber-500" subtitle="hours" />
          <StatsCard title="Avg Engagement" value={`${avgEngagement}%`} icon={ThumbsUp} color="bg-green-500" />
          <StatsCard title="Subscribers Gained" value={totalSubscribersGained} icon={Users} color="bg-purple-500" />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Views by Platform */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} 
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Views by Platform
            </h3>
            {platformData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={platformData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px", color: "#f1f5f9" }} />
                  <Bar dataKey="views" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-sm text-center py-12">No video data yet</p>
            )}
          </motion.div>

          {/* Engagement Breakdown */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} 
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> Engagement Breakdown
            </h3>
            {engagementMetrics.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={engagementMetrics} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                    {colors.map((color, i) => <Cell key={i} fill={color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px", color: "#f1f5f9" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-sm text-center py-12">No engagement data</p>
            )}
          </motion.div>
        </div>

        {/* Video Performance Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Top Videos Performance</h3>
          {performanceByVideo.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={performanceByVideo}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="title" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px", color: "#f1f5f9" }} />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
                <Line type="monotone" dataKey="engagement" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-sm text-center py-12">No video performance data yet</p>
          )}
        </motion.div>

        {/* Video List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
          className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4">All Videos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Title</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Platform</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">Views</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">Engagement</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-600">Watch Time (hrs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {videos.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-900 font-medium">{v.video_title}</td>
                      <td className="px-4 py-3 text-slate-600 capitalize">{v.platform}</td>
                      <td className="px-4 py-3 text-right text-slate-900">{(v.views || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-slate-900">{(v.engagement_rate || 0).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right text-slate-900">{(v.watch_time_hours || 0).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}