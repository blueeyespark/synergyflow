import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TrendingUp, Activity, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const mockAudienceDemographics = [
  { name: "13-17", value: 12 },
  { name: "18-24", value: 35 },
  { name: "25-34", value: 28 },
  { name: "35-44", value: 18 },
  { name: "45+", value: 7 },
];

const mockGrowthTrends = [
  { week: "W1", subs: 100, engagement: 45, reach: 2000 },
  { week: "W2", subs: 145, engagement: 52, reach: 2800 },
  { week: "W3", subs: 189, engagement: 68, reach: 3600 },
  { week: "W4", subs: 243, engagement: 75, reach: 4200 },
];

const COLORS = ["#1e78ff", "#a855f7", "#f97316", "#22c55e", "#06b6d4"];

export default function AdvancedAnalyticsHub() {
  const [active, setActive] = useState("audience");

  const { data: videos = [] } = useQuery({
    queryKey: ["videos-all"],
    queryFn: () => base44.entities.Video.list("-created_date", 50),
  });

  const totalViews = videos.reduce((s, v) => s + (v.view_count || 0), 0);
  const avgEngagement = videos.length > 0 ? Math.round(videos.reduce((s, v) => s + ((v.like_count || 0) / Math.max(v.view_count || 1, 1)), 0) / videos.length * 100) : 0;

  return (
    <div className="space-y-6">
      <Tabs value={active} onValueChange={setActive}>
        <TabsList className="mb-6 flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="audience" className="gap-2">
            <Users className="w-4 h-4" /> Audience
          </TabsTrigger>
          <TabsTrigger value="growth" className="gap-2">
            <TrendingUp className="w-4 h-4" /> Growth
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <Activity className="w-4 h-4" /> Trends
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {active === "audience" && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-[#e8f4ff] mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" /> Age Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={mockAudienceDemographics} dataKey="value" cx="50%" cy="50%" outerRadius={80} label>
                  {mockAudienceDemographics.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-4">
              <p className="text-xs text-blue-400/40 mb-1">Total Reach</p>
              <p className="text-2xl font-black text-[#1e78ff]">{(totalViews / 1000).toFixed(0)}K+</p>
            </div>
            <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-4">
              <p className="text-xs text-blue-400/40 mb-1">Avg Engagement</p>
              <p className="text-2xl font-black text-[#22c55e]">{avgEngagement}%</p>
            </div>
            <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-4">
              <p className="text-xs text-blue-400/40 mb-1">Top Geographic Region</p>
              <p className="text-lg font-bold text-[#c8dff5]">United States</p>
              <p className="text-xs text-blue-400/50">42% of audience</p>
            </div>
          </div>
        </div>
      )}

      {active === "growth" && (
        <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-[#e8f4ff] mb-4">4-Week Growth Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockGrowthTrends}>
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="subs" fill="#1e78ff" name="Subscribers" />
              <Bar dataKey="engagement" fill="#a855f7" name="Engagement Rate" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {active === "trends" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-4">
            <p className="text-xs font-bold text-blue-400/60 uppercase mb-2">Trending Content Type</p>
            <p className="text-lg font-bold text-[#c8dff5]">Tutorials</p>
            <p className="text-xs text-green-400 mt-1">↑ 45% higher engagement</p>
          </div>
          <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-4">
            <p className="text-xs font-bold text-blue-400/60 uppercase mb-2">Best Upload Time</p>
            <p className="text-lg font-bold text-[#c8dff5]">6 PM - 8 PM</p>
            <p className="text-xs text-green-400 mt-1">Peak viewer activity</p>
          </div>
          <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-4">
            <p className="text-xs font-bold text-blue-400/60 uppercase mb-2">Optimal Video Length</p>
            <p className="text-lg font-bold text-[#c8dff5]">8-12 minutes</p>
            <p className="text-xs text-green-400 mt-1">Highest retention rate</p>
          </div>
          <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-4">
            <p className="text-xs font-bold text-blue-400/60 uppercase mb-2">Trending Topics</p>
            <p className="text-sm text-[#c8dff5]">#AI #CreatorEconomy #Streaming</p>
            <p className="text-xs text-blue-400/50 mt-1">Boost views by 2.3x</p>
          </div>
        </div>
      )}
    </div>
  );
}