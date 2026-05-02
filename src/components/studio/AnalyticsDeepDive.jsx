import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Eye, Clock, Filter } from "lucide-react";

export default function AnalyticsDeepDive() {
  const [dateRange, setDateRange] = useState("7d");

  const { data: videos = [] } = useQuery({
    queryKey: ["videos-all"],
    queryFn: () => base44.entities.Video.list("-created_date", 50),
  });

  const { data: analytics = [] } = useQuery({
    queryKey: ["video-analytics"],
    queryFn: () => base44.entities.VideoAnalytics.list("-created_date", 100),
  });

  const chartData = analytics.slice(0, 7).map(a => ({
    date: new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    views: a.views || 0,
    watchTime: a.watch_time_hours || 0,
    engagement: ((a.likes || 0) + (a.comments || 0) + (a.shares || 0)) / Math.max(a.views || 1, 1) * 100,
  }));

  const trafficSources = [
    { name: "Search", value: 2400 },
    { name: "Suggested", value: 1210 },
    { name: "External", value: 929 },
    { name: "Direct", value: 500 },
  ];

  const COLORS = ["#1e78ff", "#a855f7", "#00c8ff", "#06b6d4"];

  const topVideos = videos
    .filter(v => v.status === "ready")
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, 5);

  const avgEngagement = analytics.length > 0
    ? (analytics.reduce((s, a) => s + ((a.likes || 0) + (a.comments || 0)), 0) / analytics.reduce((s, a) => s + (a.views || 1), 0) * 100).toFixed(2)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header + Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black">Analytics Deep Dive</h2>
        <div className="flex items-center gap-2 bg-[#060d18] border border-blue-900/40 rounded-lg p-1">
          {["7d", "30d", "90d"].map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                dateRange === range ? "bg-[#1e78ff] text-white" : "text-blue-400/60 hover:text-blue-300"
              }`}
            >
              {range === "7d" ? "Last 7 days" : range === "30d" ? "Last 30 days" : "Last 90 days"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: Eye, label: "Total Views", value: analytics.reduce((s, a) => s + (a.views || 0), 0).toLocaleString() },
          { icon: Clock, label: "Watch Time (hrs)", value: analytics.reduce((s, a) => s + (a.watch_time_hours || 0), 0).toFixed(0) },
          { icon: Users, label: "Avg Engagement", value: avgEngagement + "%" },
          { icon: TrendingUp, label: "Top Video Views", value: (topVideos[0]?.view_count || 0).toLocaleString() },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-[#1e78ff]" />
                <span className="text-xs text-blue-400/60">{stat.label}</span>
              </div>
              <p className="text-2xl font-black text-[#e8f4ff]">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views & Engagement Trend */}
        <div className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4">
          <h3 className="text-sm font-bold mb-4 text-[#e8f4ff]">Views & Engagement Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a3a60" />
              <XAxis dataKey="date" stroke="#4a7ea0" />
              <YAxis stroke="#4a7ea0" />
              <Tooltip contentStyle={{ background: "#0d1820", border: "1px solid #1a3a60" }} />
              <Legend />
              <Line type="monotone" dataKey="views" stroke="#1e78ff" name="Views" />
              <Line type="monotone" dataKey="engagement" stroke="#00c8ff" name="Engagement %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Traffic Sources */}
        <div className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4">
          <h3 className="text-sm font-bold mb-4 text-[#e8f4ff]">Traffic Sources</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={trafficSources} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
                {trafficSources.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#0d1820", border: "1px solid #1a3a60" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Watch Time Distribution */}
        <div className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4">
          <h3 className="text-sm font-bold mb-4 text-[#e8f4ff]">Watch Time (hours)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a3a60" />
              <XAxis dataKey="date" stroke="#4a7ea0" />
              <YAxis stroke="#4a7ea0" />
              <Tooltip contentStyle={{ background: "#0d1820", border: "1px solid #1a3a60" }} />
              <Bar dataKey="watchTime" fill="#a855f7" name="Hours" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Videos */}
        <div className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4">
          <h3 className="text-sm font-bold mb-4 text-[#e8f4ff]">Top 5 Videos</h3>
          <div className="space-y-2">
            {topVideos.map((v, i) => (
              <div key={v.id} className="flex items-center justify-between p-2 rounded-lg bg-blue-900/10 border border-blue-900/20">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-[#1e78ff]">#{i + 1}</span>
                  <p className="text-xs text-[#c8dff5] truncate">{v.title}</p>
                </div>
                <p className="text-xs font-bold text-[#00c8ff] flex-shrink-0">{(v.view_count || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}