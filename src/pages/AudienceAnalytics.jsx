import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Clock, MessageSquare, ThumbsUp, BarChart2, TrendingUp, Users, Eye } from "lucide-react";

const MOCK_WEEKLY = [
  { day: "Mon", timeSpent: 4.2, pollRate: 12, likeComment: 3.8, views: 1200 },
  { day: "Tue", timeSpent: 5.1, pollRate: 18, likeComment: 4.2, views: 1580 },
  { day: "Wed", timeSpent: 3.8, pollRate: 9, likeComment: 3.1, views: 980 },
  { day: "Thu", timeSpent: 6.4, pollRate: 22, likeComment: 5.6, views: 2100 },
  { day: "Fri", timeSpent: 7.2, pollRate: 31, likeComment: 6.1, views: 2650 },
  { day: "Sat", timeSpent: 9.1, pollRate: 38, likeComment: 7.4, views: 3400 },
  { day: "Sun", timeSpent: 8.5, pollRate: 35, likeComment: 6.9, views: 3100 },
];

const MOCK_RADAR = [
  { metric: "Engagement", value: 82 },
  { metric: "Retention", value: 68 },
  { metric: "Poll Participation", value: 45 },
  { metric: "Comment Rate", value: 71 },
  { metric: "Share Rate", value: 55 },
  { metric: "Like Rate", value: 88 },
];

const MOCK_CONTENT = [
  { title: "Gaming Stream Highlights", timeSpent: 8.4, pollRate: 42, likeComment: 7.2, views: 4200 },
  { title: "Tutorial: Advanced Tips", timeSpent: 12.1, pollRate: 28, likeComment: 5.8, views: 3100 },
  { title: "Q&A Session", timeSpent: 6.2, pollRate: 67, likeComment: 9.1, views: 2800 },
  { title: "Reaction Video", timeSpent: 4.8, pollRate: 15, likeComment: 4.4, views: 5600 },
  { title: "Behind the Scenes", timeSpent: 9.3, pollRate: 22, likeComment: 6.3, views: 1900 },
];

function MetricCard({ label, value, unit, icon: Icon, color, subtitle }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500 dark:text-zinc-400">{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + "22" }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-black text-gray-900 dark:text-white">{value}<span className="text-sm font-normal text-gray-400 dark:text-zinc-500 ml-1">{unit}</span></p>
      {subtitle && <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">{subtitle}</p>}
    </motion.div>
  );
}

export default function AudienceAnalytics() {
  const [activeMetric, setActiveMetric] = useState("timeSpent");

  const metrics = [
    { key: "timeSpent", label: "Avg. Time Spent", color: "#06b6d4" },
    { key: "pollRate", label: "Poll Participation %", color: "#a855f7" },
    { key: "likeComment", label: "Like:Comment Ratio", color: "#f97316" },
  ];

  const activeColor = metrics.find(m => m.key === activeMetric)?.color || "#06b6d4";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Audience Analytics</h1>
        <p className="text-gray-500 dark:text-zinc-400 mt-1">Understand how your audience interacts with your content</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Avg. Time Spent" value="6.8" unit="min" icon={Clock} color="#06b6d4" subtitle="Per video session" />
        <MetricCard label="Poll Participation" value="26%" unit="" icon={BarChart2} color="#a855f7" subtitle="Avg across all polls" />
        <MetricCard label="Like:Comment Ratio" value="5.6" unit="x" icon={ThumbsUp} color="#f97316" subtitle="Likes per comment" />
        <MetricCard label="Weekly Views" value="15.0K" unit="" icon={Eye} color="#22c55e" subtitle="+18% vs last week" />
      </div>

      {/* Interactive Trend Line */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Weekly Interaction Trends</h2>
          <div className="flex gap-1 flex-wrap">
            {metrics.map(m => (
              <button key={m.key} onClick={() => setActiveMetric(m.key)}
                className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                style={activeMetric === m.key ? { backgroundColor: m.color, color: "#fff" } : {}}>
                {activeMetric !== m.key && (
                  <span className="text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-lg block">
                    {m.label}
                  </span>
                )}
                {activeMetric === m.key && m.label}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={MOCK_WEEKLY}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-zinc-800" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey={activeMetric}
              stroke={activeColor}
              strokeWidth={3}
              dot={{ fill: activeColor, r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Radar / Audience Score */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Audience Engagement Score</h2>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={MOCK_RADAR} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
              <Radar name="Score" dataKey="value" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Poll Participation Bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Daily Poll Participation</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={MOCK_WEEKLY} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-zinc-800" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v) => [`${v}%`, "Poll Rate"]} />
              <Bar dataKey="pollRate" fill="#a855f7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Per-Content Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Content Interaction Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-zinc-800">
                <th className="text-left py-2 pr-4 text-gray-500 dark:text-zinc-400 font-medium">Content</th>
                <th className="text-right py-2 px-3 text-gray-500 dark:text-zinc-400 font-medium">Views</th>
                <th className="text-right py-2 px-3 text-gray-500 dark:text-zinc-400 font-medium">Avg. Time</th>
                <th className="text-right py-2 px-3 text-gray-500 dark:text-zinc-400 font-medium">Poll Rate</th>
                <th className="text-right py-2 pl-3 text-gray-500 dark:text-zinc-400 font-medium">Like:Comment</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_CONTENT.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3 pr-4 text-gray-900 dark:text-white font-medium">{row.title}</td>
                  <td className="py-3 px-3 text-right text-gray-600 dark:text-zinc-300">{row.views.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{row.timeSpent}m</span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-purple-600 dark:text-purple-400 font-semibold">{row.pollRate}%</span>
                  </td>
                  <td className="py-3 pl-3 text-right">
                    <span className="text-orange-600 dark:text-orange-400 font-semibold">{row.likeComment}x</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}