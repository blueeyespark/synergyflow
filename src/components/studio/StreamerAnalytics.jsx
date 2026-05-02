import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  Eye, ThumbsUp, Clock, Play, TrendingUp, Users, DollarSign,
  Heart, ShoppingBag, ArrowUpRight, ArrowDownRight, Info,
  BarChart2, MessageSquare, Share2, Star, Zap, Target, Radio,
  Calendar, Globe
} from "lucide-react";

// ─── Mock / seed data ────────────────────────────────────────────────────────

function mkDays(n, base = 400, noise = 300) {
  const today = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (n - 1 - i));
    return {
      date: d.toISOString().slice(5, 10),
      views: Math.floor(base + Math.random() * noise),
      watch_hours: +(Math.random() * 18 + 2).toFixed(1),
      likes: Math.floor(Math.random() * 120 + 20),
      comments: Math.floor(Math.random() * 40 + 5),
      shares: Math.floor(Math.random() * 30 + 3),
      subs_gained: Math.floor(Math.random() * 25),
    };
  });
}

const DAILY_90 = mkDays(90, 500, 600);

const MOCK_WEEKLY = [
  { day: "Mon", views: 1200, watchH: 4.2, pollRate: 12, engagement: 3.8, subs: 14 },
  { day: "Tue", views: 1580, watchH: 5.1, pollRate: 18, engagement: 4.2, subs: 19 },
  { day: "Wed", views: 980,  watchH: 3.8, pollRate: 9,  engagement: 3.1, subs: 11 },
  { day: "Thu", views: 2100, watchH: 6.4, pollRate: 22, engagement: 5.6, subs: 27 },
  { day: "Fri", views: 2650, watchH: 7.2, pollRate: 31, engagement: 6.1, subs: 33 },
  { day: "Sat", views: 3400, watchH: 9.1, pollRate: 38, engagement: 7.4, subs: 48 },
  { day: "Sun", views: 3100, watchH: 8.5, pollRate: 35, engagement: 6.9, subs: 41 },
];

const MOCK_RADAR = [
  { metric: "Engagement",       value: 82 },
  { metric: "Retention",        value: 68 },
  { metric: "Poll Rate",        value: 45 },
  { metric: "Comment Rate",     value: 71 },
  { metric: "Share Rate",       value: 55 },
  { metric: "Like Rate",        value: 88 },
  { metric: "Sub Growth",       value: 63 },
  { metric: "CTR",              value: 74 },
];

const MOCK_CONTENT = [
  { title: "Gaming Stream Highlights", views: 4200, watchMin: 8.4, retention: 72, comments: 142, shares: 89 },
  { title: "Tutorial: Advanced Tips",  views: 3100, watchMin: 12.1, retention: 81, comments: 98,  shares: 54 },
  { title: "Q&A Session",             views: 2800, watchMin: 6.2, retention: 64, comments: 231, shares: 30 },
  { title: "Reaction Video",          views: 5600, watchMin: 4.8, retention: 55, comments: 77,  shares: 201 },
  { title: "Behind the Scenes",       views: 1900, watchMin: 9.3, retention: 78, comments: 63,  shares: 41 },
];

const RETENTION_CURVE = Array.from({ length: 20 }, (_, i) => ({
  pct: `${i * 5}%`,
  viewers: Math.max(0, Math.round(100 - i * 2.8 - (i > 10 ? (i - 10) * 1.5 : 0))),
}));

const TRAFFIC_SOURCES = [
  { source: "Browse / Feed",   pct: 38 },
  { source: "Search",          pct: 22 },
  { source: "Subscriptions",   pct: 17 },
  { source: "Notifications",   pct: 9  },
  { source: "External",        pct: 8  },
  { source: "Direct",          pct: 6  },
];

const BEST_TIMES = [
  { hour: "6am",  score: 30 }, { hour: "8am", score: 45 }, { hour: "10am", score: 55 },
  { hour: "12pm", score: 62 }, { hour: "2pm", score: 48 }, { hour: "4pm", score: 60 },
  { hour: "6pm",  score: 78 }, { hour: "8pm", score: 95 }, { hour: "10pm", score: 85 },
  { hour: "12am", score: 40 },
];

const MOCK_MONTHLY = [
  { month: "Oct", memberships: 420, tips: 180, products: 95,  ads: 310 },
  { month: "Nov", memberships: 480, tips: 210, products: 120, ads: 340 },
  { month: "Dec", memberships: 610, tips: 390, products: 210, ads: 420 },
  { month: "Jan", memberships: 570, tips: 280, products: 175, ads: 380 },
  { month: "Feb", memberships: 640, tips: 320, products: 240, ads: 410 },
  { month: "Mar", memberships: 720, tips: 410, products: 295, ads: 490 },
  { month: "Apr", memberships: 810, tips: 460, products: 340, ads: 530 },
];

const MOCK_REVENUE = [
  { name: "Memberships", value: 810,  color: "#1e78ff", icon: Users,       change: +12.5 },
  { name: "Tips/Superchats", value: 460, color: "#a855f7", icon: Heart,   change: +8.2  },
  { name: "Product Sales", value: 340,  color: "#f97316", icon: ShoppingBag, change: +15.7 },
  { name: "Ad Revenue",   value: 530,  color: "#22c55e", icon: DollarSign, change: +4.1  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  if (!n) return "0";
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(n);
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-[#060d18] border border-blue-900/40 rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  );
}

function StatKPI({ icon: Icon, label, value, sub, color = "#1e78ff", change }) {
  const pos = change >= 0;
  return (
    <Card className="flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "22" }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-blue-400/60">{label}</p>
        <p className="text-xl font-black text-[#e8f4ff]">{value}</p>
        {sub && <p className="text-xs text-blue-400/50 mt-0.5">{sub}</p>}
      </div>
      {change !== undefined && (
        <span className={`text-xs font-bold flex items-center gap-0.5 ${pos ? "text-green-400" : "text-red-400"}`}>
          {pos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(change)}%
        </span>
      )}
    </Card>
  );
}

const SECTION_TABS = [
  { id: "overview",   label: "Overview",     icon: BarChart2  },
  { id: "content",    label: "Content",      icon: Play       },
  { id: "audience",   label: "Audience",     icon: Users      },
  { id: "revenue",    label: "Revenue",      icon: DollarSign },
  { id: "growth",     label: "Growth",       icon: TrendingUp },
  { id: "planning",   label: "Best Times",   icon: Calendar   },
];

const RANGE_OPTS = [7, 30, 90];

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const CyberTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#060d18] border border-blue-900/50 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-blue-400/70 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function StreamerAnalytics() {
  const [section, setSection] = useState("overview");
  const [range, setRange] = useState(30);
  const [revenueRange, setRevenueRange] = useState("7m");

  const { data: videos = [] } = useQuery({
    queryKey: ["videos-all"],
    queryFn: () => base44.entities.Video.list("-created_date", 100),
    staleTime: 5 * 60 * 1000,
  });

  const { data: analyticsRows = [] } = useQuery({
    queryKey: ["video-analytics-all"],
    queryFn: () => base44.entities.VideoAnalytics.list("-date", 200),
    staleTime: 5 * 60 * 1000,
  });

  const activeVideos = videos.filter(v => v.status !== "deleted" && v.status !== "uploading");
  const totalViews = activeVideos.reduce((s, v) => s + (v.view_count || 0), 0);
  const totalLikes = activeVideos.reduce((s, v) => s + (v.like_count || 0), 0);
  const totalComments = activeVideos.reduce((s, v) => s + (v.comment_count || 0), 0);
  const avgDur = activeVideos.length
    ? Math.round(activeVideos.reduce((s, v) => s + (v.duration_seconds || 0), 0) / activeVideos.length)
    : 0;

  // Build daily chart from real data or seed data
  const analyticsMap = {};
  analyticsRows.forEach(a => {
    if (!analyticsMap[a.date]) analyticsMap[a.date] = { views: 0, watch_time: 0, likes: 0 };
    analyticsMap[a.date].views += a.views || 0;
    analyticsMap[a.date].watch_time += a.watch_time_hours || 0;
    analyticsMap[a.date].likes += a.likes || 0;
  });

  const slicedDays = DAILY_90.slice(90 - range);
  const viewsData = slicedDays.map(d => ({
    ...d,
    views: analyticsMap[d.date]?.views || d.views,
    watch_hours: analyticsMap[d.date]?.watch_time || d.watch_hours,
  }));

  const topVideos = [...activeVideos].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 8);

  const catData = activeVideos.reduce((acc, v) => {
    const c = v.category || "Other";
    acc[c] = (acc[c] || 0) + (v.view_count || 0);
    return acc;
  }, {});
  const catChartData = Object.entries(catData).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, views]) => ({ name, views }));

  const grossRevenue = MOCK_REVENUE.reduce((s, i) => s + i.value, 0);
  const creatorEarnings = Math.round(grossRevenue * 0.8);
  const displayMonthly = revenueRange === "3m" ? MOCK_MONTHLY.slice(-3) : revenueRange === "6m" ? MOCK_MONTHLY.slice(-6) : MOCK_MONTHLY;

  return (
    <div className="space-y-5">
      {/* Section tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {SECTION_TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setSection(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                section === t.id
                  ? "bg-[#1e78ff]/15 text-[#1e78ff] border-[#1e78ff]/40"
                  : "text-blue-400/60 border-blue-900/30 hover:text-blue-300 hover:border-blue-700/40"
              }`}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      <motion.div key={section} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {section === "overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatKPI icon={Eye}         label="Total Views"   value={fmt(totalViews)}  sub="all time"         color="#1e78ff"  change={18} />
              <StatKPI icon={Play}        label="Videos"        value={activeVideos.length} sub="published"     color="#a855f7"  change={5}  />
              <StatKPI icon={ThumbsUp}    label="Total Likes"   value={fmt(totalLikes)}  sub="all time"         color="#22c55e"  change={11} />
              <StatKPI icon={MessageSquare} label="Comments"   value={fmt(totalComments)} sub="all time"        color="#f97316"  change={7}  />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatKPI icon={Clock}       label="Avg Duration"  value={`${Math.floor(avgDur/60)}m ${avgDur%60}s`} color="#06b6d4" />
              <StatKPI icon={Users}       label="Subscribers"   value="12.4K"  sub="+193 this week"  color="#1e78ff"  change={4}  />
              <StatKPI icon={Share2}      label="Total Shares"  value="8.2K"   sub="all time"        color="#a855f7"  change={22} />
              <StatKPI icon={DollarSign}  label="Monthly Rev"   value={`$${grossRevenue.toLocaleString()}`} sub="est." color="#22c55e" change={12} />
            </div>

            {/* Views + Watch Time chart */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#1e78ff]" />
                  <h3 className="font-bold text-[#e8f4ff] text-sm">Views & Watch Time</h3>
                </div>
                <div className="flex gap-1">
                  {RANGE_OPTS.map(r => (
                    <button key={r} onClick={() => setRange(r)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${range === r ? "bg-[#1e78ff] text-white" : "bg-[#0a1525] text-blue-400/60 hover:text-blue-300"}`}>
                      {r}d
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={viewsData}>
                  <defs>
                    <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1e78ff" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#1e78ff" stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="gWatch" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00c8ff" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#00c8ff" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#3a6080" }} tickLine={false} interval={range > 30 ? 13 : 5} />
                  <YAxis tick={{ fontSize: 10, fill: "#3a6080" }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CyberTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#4a7ea0" }} />
                  <Area type="monotone" dataKey="views"       name="Views"      stroke="#1e78ff" fill="url(#gViews)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="watch_hours" name="Watch Hrs"  stroke="#00c8ff" fill="url(#gWatch)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Weekly pattern */}
            <Card>
              <h3 className="font-bold text-[#e8f4ff] text-sm mb-4 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-[#a855f7]" /> Daily Pattern This Week</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={MOCK_WEEKLY} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#3a6080" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#3a6080" }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CyberTooltip />} />
                  <Bar dataKey="views" name="Views" fill="#1e78ff" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="subs"  name="New Subs" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* ── CONTENT ──────────────────────────────────────────────────────── */}
        {section === "content" && (
          <div className="space-y-5">
            {/* Top videos */}
            <Card>
              <h3 className="font-bold text-[#e8f4ff] text-sm mb-4 flex items-center gap-2"><Star className="w-4 h-4 text-yellow-400" /> Top Performing Videos</h3>
              <div className="space-y-3">
                {(topVideos.length > 0 ? topVideos : MOCK_CONTENT.map((c, i) => ({ id: i, title: c.title, view_count: c.views, like_count: c.views * 0.03, comment_count: c.comments }))).map((v, i) => (
                  <div key={v.id ?? i} className="flex items-center gap-3 group">
                    <span className="text-xs font-bold text-blue-500/50 w-5 flex-shrink-0">#{i + 1}</span>
                    <div className="w-14 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-[#0a1525] border border-blue-900/30">
                      {v.thumbnail_url && <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#c8dff5] truncate">{v.title}</p>
                      <div className="flex gap-3 mt-0.5">
                        <span className="text-xs text-blue-500/60">{fmt(v.view_count)} views</span>
                        <span className="text-xs text-blue-500/60">{fmt(v.like_count)} likes</span>
                      </div>
                    </div>
                    <div className="w-24 h-1.5 bg-[#0a1525] rounded-full overflow-hidden flex-shrink-0">
                      <div className="h-full bg-gradient-to-r from-[#1e78ff] to-[#00c8ff] rounded-full"
                        style={{ width: `${topVideos[0]?.view_count ? Math.round((v.view_count || 0) / (topVideos[0]?.view_count || 1) * 100) : 60}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Audience Retention Curve */}
            <Card>
              <h3 className="font-bold text-[#e8f4ff] text-sm mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-400" /> Avg. Audience Retention Curve</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={RETENTION_CURVE}>
                  <defs>
                    <linearGradient id="gRet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                  <XAxis dataKey="pct" tick={{ fontSize: 10, fill: "#3a6080" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#3a6080" }} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip content={<CyberTooltip />} />
                  <Area type="monotone" dataKey="viewers" name="% Watching" stroke="#22c55e" fill="url(#gRet)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-xs text-blue-400/50 mt-2">Average: 68% retention — above platform average (55%)</p>
            </Card>

            <div className="grid lg:grid-cols-2 gap-5">
              {/* Category breakdown */}
              <Card>
                <h3 className="font-bold text-[#e8f4ff] text-sm mb-4 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-yellow-400" /> Views by Category</h3>
                {catChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={catChartData} layout="vertical" barSize={14}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "#3a6080" }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#3a6080" }} tickLine={false} width={70} />
                      <Tooltip content={<CyberTooltip />} />
                      <Bar dataKey="views" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-40 flex items-center justify-center">
                    <p className="text-blue-400/40 text-sm">No category data yet</p>
                  </div>
                )}
              </Card>

              {/* Content interaction table */}
              <Card>
                <h3 className="font-bold text-[#e8f4ff] text-sm mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[#a855f7]" /> Content Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-blue-900/30">
                        <th className="text-left py-2 pr-3 text-blue-400/50 font-medium">Title</th>
                        <th className="text-right py-2 px-2 text-blue-400/50 font-medium">Views</th>
                        <th className="text-right py-2 px-2 text-blue-400/50 font-medium">Ret%</th>
                        <th className="text-right py-2 pl-2 text-blue-400/50 font-medium">Shares</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_CONTENT.map((row, i) => (
                        <tr key={i} className="border-b border-blue-900/20 hover:bg-blue-900/10 transition-colors">
                          <td className="py-2 pr-3 text-[#c8dff5] truncate max-w-[140px]">{row.title}</td>
                          <td className="py-2 px-2 text-right text-blue-400/70">{row.views.toLocaleString()}</td>
                          <td className="py-2 px-2 text-right text-green-400 font-semibold">{row.retention}%</td>
                          <td className="py-2 pl-2 text-right text-[#a855f7] font-semibold">{row.shares}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ── AUDIENCE ─────────────────────────────────────────────────────── */}
        {section === "audience" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatKPI icon={Clock}        label="Avg Watch Time"  value="6.8m"  sub="per session"    color="#06b6d4"  change={5}  />
              <StatKPI icon={BarChart2}    label="Poll Rate"       value="26%"   sub="avg participation" color="#a855f7" change={3}  />
              <StatKPI icon={ThumbsUp}     label="Like Ratio"      value="5.6x"  sub="likes per comment" color="#f97316" change={8}  />
              <StatKPI icon={Eye}          label="Weekly Views"    value="15.0K" sub="+18% last week"  color="#22c55e"  change={18} />
            </div>

            {/* Engagement Radar */}
            <div className="grid lg:grid-cols-2 gap-5">
              <Card>
                <h3 className="font-bold text-[#e8f4ff] text-sm mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-[#1e78ff]" /> Audience Engagement Score</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={MOCK_RADAR} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="#0d2040" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "#4a7ea0" }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                    <Radar name="Score" dataKey="value" stroke="#1e78ff" fill="#1e78ff" fillOpacity={0.2} strokeWidth={2} />
                    <Tooltip content={<CyberTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>

              {/* Traffic sources */}
              <Card>
                <h3 className="font-bold text-[#e8f4ff] text-sm mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-[#00c8ff]" /> Traffic Sources</h3>
                <div className="space-y-3">
                  {TRAFFIC_SOURCES.map((s, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#9fc3e8]">{s.source}</span>
                        <span className="text-[#1e78ff] font-semibold">{s.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-[#0a1525] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#1e78ff] to-[#00c8ff] rounded-full transition-all"
                          style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Weekly interaction trends */}
            <Card>
              <h3 className="font-bold text-[#e8f4ff] text-sm mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#a855f7]" /> Weekly Engagement Trends</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={MOCK_WEEKLY}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#3a6080" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#3a6080" }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CyberTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#4a7ea0" }} />
                  <Line type="monotone" dataKey="watchH"     name="Avg Watch Hrs" stroke="#1e78ff" strokeWidth={2} dot={{ fill: "#1e78ff", r: 3 }} />
                  <Line type="monotone" dataKey="pollRate"   name="Poll Rate %"   stroke="#a855f7" strokeWidth={2} dot={{ fill: "#a855f7", r: 3 }} />
                  <Line type="monotone" dataKey="engagement" name="Engagement"    stroke="#f97316" strokeWidth={2} dot={{ fill: "#f97316", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* ── REVENUE ──────────────────────────────────────────────────────── */}
        {section === "revenue" && (
          <div className="space-y-5">
            {/* Revenue banner */}
            <div className="bg-gradient-to-r from-[#1e78ff]/20 to-[#a855f7]/20 border border-[#1e78ff]/30 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                <div>
                  <p className="text-blue-400/70 text-sm">Gross Revenue This Month</p>
                  <p className="text-4xl font-black text-[#e8f4ff]">${grossRevenue.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 bg-[#1e78ff]/20 border border-[#1e78ff]/30 rounded-xl px-4 py-2">
                  <TrendingUp className="w-4 h-4 text-[#1e78ff]" />
                  <span className="text-sm font-bold text-[#1e78ff]">+12% vs last month</span>
                </div>
              </div>
              <div className="bg-[#03080f]/60 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-3.5 h-3.5 text-blue-400/50" />
                  <span className="text-blue-400/50 text-xs">Revenue split: 80% creator · 20% platform</span>
                </div>
                <div className="flex h-2.5 rounded-full overflow-hidden mb-3 border border-blue-900/30">
                  <div className="bg-[#1e78ff]" style={{ width: "80%" }} />
                  <div className="bg-blue-900/40" style={{ width: "20%" }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-blue-400/50 text-xs">Your Earnings (80%)</p>
                    <p className="text-2xl font-black text-[#e8f4ff]">${creatorEarnings.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-400/50 text-xs">Platform Fee (20%)</p>
                    <p className="text-2xl font-black text-blue-500/50">${(grossRevenue - creatorEarnings).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {MOCK_REVENUE.map((r, i) => (
                <StatKPI key={i} icon={r.icon} label={r.name} value={`$${r.value}`} color={r.color} change={r.change} />
              ))}
            </div>

            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#e8f4ff] text-sm">Revenue Trends</h3>
                <div className="flex gap-1">
                  {["3m", "6m", "7m"].map(r => (
                    <button key={r} onClick={() => setRevenueRange(r)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${revenueRange === r ? "bg-[#1e78ff] text-white" : "bg-[#0a1525] text-blue-400/60 hover:text-blue-300"}`}>
                      {r === "7m" ? "All" : r}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={displayMonthly}>
                  <defs>
                    {[["b", "#1e78ff"], ["p", "#a855f7"], ["o", "#f97316"], ["g", "#22c55e"]].map(([k, c]) => (
                      <linearGradient key={k} id={`rg-${k}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={c} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={c} stopOpacity={0}   />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#3a6080" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#3a6080" }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<CyberTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#4a7ea0" }} />
                  <Area type="monotone" dataKey="memberships" name="Memberships" stroke="#1e78ff" fill="url(#rg-b)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="tips"        name="Tips"        stroke="#a855f7" fill="url(#rg-p)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="products"    name="Products"    stroke="#f97316" fill="url(#rg-o)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="ads"         name="Ads"         stroke="#22c55e" fill="url(#rg-g)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* ── GROWTH ───────────────────────────────────────────────────────── */}
        {section === "growth" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatKPI icon={Users}      label="Total Subs"       value="12.4K" sub="+193 this week"   color="#1e78ff"  change={4}  />
              <StatKPI icon={TrendingUp} label="Sub Growth Rate"  value="+1.6%" sub="week over week"   color="#22c55e"  change={12} />
              <StatKPI icon={Zap}        label="Viral Score"      value="74"    sub="out of 100"       color="#a855f7"  change={9}  />
              <StatKPI icon={Radio}      label="Live Viewers"     value="832"   sub="avg peak"         color="#f97316"  change={15} />
            </div>

            {/* Sub growth chart */}
            <Card>
              <h3 className="font-bold text-[#e8f4ff] text-sm mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-[#1e78ff]" /> Subscriber Growth</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={viewsData}>
                  <defs>
                    <linearGradient id="gSubs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#3a6080" }} tickLine={false} interval={range > 30 ? 13 : 5} />
                  <YAxis tick={{ fontSize: 10, fill: "#3a6080" }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CyberTooltip />} />
                  <Area type="monotone" dataKey="subs_gained" name="New Subs" stroke="#22c55e" fill="url(#gSubs)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Shares & viral spread */}
            <Card>
              <h3 className="font-bold text-[#e8f4ff] text-sm mb-4 flex items-center gap-2"><Share2 className="w-4 h-4 text-[#a855f7]" /> Shares & Viral Spread</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={MOCK_WEEKLY} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#3a6080" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#3a6080" }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CyberTooltip />} />
                  <Bar dataKey="subs"  name="New Subs"  fill="#1e78ff"  radius={[4, 4, 0, 0]} />
                  <Bar dataKey="views" name="Views"     fill="#a855f7"  radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* ── BEST TIMES ───────────────────────────────────────────────────── */}
        {section === "planning" && (
          <div className="space-y-5">
            <Card>
              <h3 className="font-bold text-[#e8f4ff] text-sm mb-1 flex items-center gap-2"><Calendar className="w-4 h-4 text-[#1e78ff]" /> Best Times to Post / Go Live</h3>
              <p className="text-xs text-blue-400/50 mb-4">Based on your audience's activity patterns. Higher = more viewers online.</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={BEST_TIMES} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#3a6080" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#3a6080" }} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip content={<CyberTooltip />} />
                  <Bar dataKey="score" name="Audience Score" radius={[4, 4, 0, 0]}
                    fill="#1e78ff"
                    label={{ position: "top", fontSize: 9, fill: "#3a6080" }} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-[#1e78ff] font-semibold mt-2">⚡ Peak: 8 PM — best time to go live or premiere</p>
            </Card>

            <div className="grid lg:grid-cols-2 gap-5">
              <Card>
                <h3 className="font-bold text-[#e8f4ff] text-sm mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-green-400" /> Upload Strategy Tips</h3>
                <div className="space-y-3">
                  {[
                    { tip: "Go live Thursday–Sunday evenings for peak viewers", score: "95" },
                    { tip: "Upload tutorials on Tue/Wed — high search traffic those days", score: "82" },
                    { tip: "Shorts perform best posted 10am–12pm", score: "78" },
                    { tip: "Q&A streams drive 67% higher poll participation", score: "74" },
                    { tip: "Gaming highlights get 2.3x more shares on Friday", score: "71" },
                  ].map((t, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-[#0a1525] border border-blue-900/30 rounded-xl">
                      <div className="text-xs font-bold text-[#1e78ff] bg-[#1e78ff]/15 rounded-lg px-1.5 py-0.5 flex-shrink-0">{t.score}</div>
                      <p className="text-xs text-[#9fc3e8]">{t.tip}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="font-bold text-[#e8f4ff] text-sm mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> Content Format Performance</h3>
                <div className="space-y-3">
                  {[
                    { format: "Live Streams",   retention: 72, subs: 48, views: 3400 },
                    { format: "Tutorials",       retention: 81, subs: 33, views: 2100 },
                    { format: "Shorts",          retention: 55, subs: 27, views: 5600 },
                    { format: "Reaction Videos", retention: 52, subs: 19, views: 4200 },
                    { format: "Q&A",             retention: 64, subs: 41, views: 2800 },
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-[#c8dff5] w-28 flex-shrink-0">{f.format}</span>
                      <div className="flex-1 h-1.5 bg-[#0a1525] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#1e78ff] to-[#00c8ff] rounded-full" style={{ width: `${f.retention}%` }} />
                      </div>
                      <span className="text-xs text-[#1e78ff] font-semibold w-10 text-right">{f.retention}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
}