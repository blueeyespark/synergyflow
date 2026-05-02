import { useState, useMemo } from "react";
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

// ── Static seed data (stable references, no random on render) ────────────────

const DAILY_90 = (() => {
  const today = new Date();
  return Array.from({ length: 90 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (89 - i));
    const seed = i * 7 + 13;
    return {
      date: d.toISOString().slice(5, 10),
      views: 300 + (seed * 23) % 700,
      watch_hours: +((2 + (seed * 3) % 18).toFixed(1)),
      likes: 20 + (seed * 11) % 130,
      comments: 5 + (seed * 7) % 45,
      shares: 3 + (seed * 5) % 35,
      subs_gained: (seed * 4) % 28,
    };
  });
})();

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
  { metric: "Engagement",  value: 82 },
  { metric: "Retention",   value: 68 },
  { metric: "Poll Rate",   value: 45 },
  { metric: "Comment Rate",value: 71 },
  { metric: "Share Rate",  value: 55 },
  { metric: "Like Rate",   value: 88 },
  { metric: "Sub Growth",  value: 63 },
  { metric: "CTR",         value: 74 },
];

const MOCK_CONTENT = [
  { title: "Gaming Stream Highlights", views: 4200, retention: 72, comments: 142, shares: 89 },
  { title: "Tutorial: Advanced Tips",  views: 3100, retention: 81, comments: 98,  shares: 54 },
  { title: "Q&A Session",             views: 2800, retention: 64, comments: 231, shares: 30 },
  { title: "Reaction Video",          views: 5600, retention: 55, comments: 77,  shares: 201 },
  { title: "Behind the Scenes",       views: 1900, retention: 78, comments: 63,  shares: 41  },
];

const RETENTION_CURVE = Array.from({ length: 20 }, (_, i) => ({
  pct: `${i * 5}%`,
  viewers: Math.max(0, Math.round(100 - i * 2.8 - (i > 10 ? (i - 10) * 1.5 : 0))),
}));

const TRAFFIC_SOURCES = [
  { source: "Browse / Feed",  pct: 38 },
  { source: "Search",         pct: 22 },
  { source: "Subscriptions",  pct: 17 },
  { source: "Notifications",  pct: 9  },
  { source: "External",       pct: 8  },
  { source: "Direct",         pct: 6  },
];

const BEST_TIMES = [
  { hour: "6am",  score: 30 }, { hour: "8am",  score: 45 },
  { hour: "10am", score: 55 }, { hour: "12pm", score: 62 },
  { hour: "2pm",  score: 48 }, { hour: "4pm",  score: 60 },
  { hour: "6pm",  score: 78 }, { hour: "8pm",  score: 95 },
  { hour: "10pm", score: 85 }, { hour: "12am", score: 40 },
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
  { name: "Memberships",    value: 810, color: "#1e78ff", icon: Users,       change: 12.5 },
  { name: "Tips/Superchats",value: 460, color: "#a855f7", icon: Heart,       change: 8.2  },
  { name: "Product Sales",  value: 340, color: "#f97316", icon: ShoppingBag, change: 15.7 },
  { name: "Ad Revenue",     value: 530, color: "#22c55e", icon: DollarSign,  change: 4.1  },
];

const CONTENT_FORMATS = [
  { format: "Live Streams",   retention: 72 },
  { format: "Tutorials",      retention: 81 },
  { format: "Shorts",         retention: 55 },
  { format: "Reaction Videos",retention: 52 },
  { format: "Q&A",            retention: 64 },
];

const STRATEGY_TIPS = [
  { tip: "Go live Thursday–Sunday evenings for peak viewers",       score: 95 },
  { tip: "Upload tutorials Tue/Wed — high search traffic",          score: 82 },
  { tip: "Shorts perform best posted 10am–12pm",                    score: 78 },
  { tip: "Q&A streams drive 67% higher poll participation",         score: 74 },
  { tip: "Gaming highlights get 2.3× more shares on Friday",        score: 71 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n) {
  if (!n && n !== 0) return "0";
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(n);
}

// ── Shared UI atoms ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, color = "#1e78ff" }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + "22" }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <h2 className="text-base font-bold text-[#e8f4ff]">{title}</h2>
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-[#060d18] border border-blue-900/40 rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  );
}

function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-blue-900/40" />
      <span className="text-xs font-bold uppercase tracking-widest text-blue-500/40">{label}</span>
      <div className="flex-1 h-px bg-blue-900/40" />
    </div>
  );
}

function KPI({ icon: Icon, label, value, sub, color = "#1e78ff", change }) {
  const pos = change === undefined || change >= 0;
  return (
    <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "22" }}>
        <Icon className="w-4.5 h-4.5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-blue-400/50 leading-none mb-1">{label}</p>
        <p className="text-lg font-black text-[#e8f4ff] leading-none">{value}</p>
        {sub && <p className="text-xs text-blue-400/40 mt-1">{sub}</p>}
      </div>
      {change !== undefined && (
        <span className={`text-xs font-bold flex items-center gap-0.5 flex-shrink-0 ${pos ? "text-green-400" : "text-red-400"}`}>
          {pos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(change)}%
        </span>
      )}
    </div>
  );
}

const CyberTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#060d18] border border-blue-900/50 rounded-xl px-3 py-2 text-xs shadow-xl z-50">
      <p className="text-blue-400/60 mb-1 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {typeof p.value === "number" && p.value > 100 ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

const RANGE_OPTS = [7, 30, 90];

// ── Main component ────────────────────────────────────────────────────────────

export default function StreamerAnalytics() {
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

  const activeVideos = useMemo(() => videos.filter(v => v.status !== "deleted" && v.status !== "uploading"), [videos]);
  const totalViews    = useMemo(() => activeVideos.reduce((s, v) => s + (v.view_count    || 0), 0), [activeVideos]);
  const totalLikes    = useMemo(() => activeVideos.reduce((s, v) => s + (v.like_count    || 0), 0), [activeVideos]);
  const totalComments = useMemo(() => activeVideos.reduce((s, v) => s + (v.comment_count || 0), 0), [activeVideos]);
  const avgDur        = useMemo(() => activeVideos.length
    ? Math.round(activeVideos.reduce((s, v) => s + (v.duration_seconds || 0), 0) / activeVideos.length) : 0,
    [activeVideos]);

  const analyticsMap = useMemo(() => {
    const m = {};
    analyticsRows.forEach(a => {
      if (!m[a.date]) m[a.date] = { views: 0, watch_time: 0 };
      m[a.date].views      += a.views || 0;
      m[a.date].watch_time += a.watch_time_hours || 0;
    });
    return m;
  }, [analyticsRows]);

  const viewsData = useMemo(() => {
    return DAILY_90.slice(90 - range).map(d => ({
      ...d,
      views:       analyticsMap[d.date]?.views      || d.views,
      watch_hours: analyticsMap[d.date]?.watch_time || d.watch_hours,
    }));
  }, [range, analyticsMap]);

  const topVideos = useMemo(() =>
    [...activeVideos].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 8),
    [activeVideos]);

  const catChartData = useMemo(() => {
    const catData = {};
    activeVideos.forEach(v => {
      const c = v.category || "Other";
      catData[c] = (catData[c] || 0) + (v.view_count || 0);
    });
    return Object.entries(catData).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, views]) => ({ name, views }));
  }, [activeVideos]);

  const grossRevenue    = MOCK_REVENUE.reduce((s, i) => s + i.value, 0);
  const creatorEarnings = Math.round(grossRevenue * 0.8);
  const displayMonthly  = revenueRange === "3m" ? MOCK_MONTHLY.slice(-3) : revenueRange === "6m" ? MOCK_MONTHLY.slice(-6) : MOCK_MONTHLY;

  const displayTopVideos = topVideos.length > 0
    ? topVideos
    : MOCK_CONTENT.map((c, i) => ({ id: i, title: c.title, view_count: c.views, like_count: Math.floor(c.views * 0.03), thumbnail_url: null }));
  const maxViews = displayTopVideos[0]?.view_count || 1;

  return (
    <div className="space-y-8 pb-6">

      {/* ── 1. PERFORMANCE OVERVIEW ──────────────────────────────────────── */}
      <section>
        <SectionHeader icon={BarChart2} title="Performance Overview" color="#1e78ff" />

        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <KPI icon={Eye}           label="Total Views"    value={fmt(totalViews)}    sub="all time"         color="#1e78ff" change={18} />
          <KPI icon={Play}          label="Videos"         value={activeVideos.length} sub="published"       color="#a855f7" change={5}  />
          <KPI icon={ThumbsUp}      label="Total Likes"    value={fmt(totalLikes)}    sub="all time"         color="#22c55e" change={11} />
          <KPI icon={MessageSquare} label="Comments"       value={fmt(totalComments)} sub="all time"         color="#f97316" change={7}  />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <KPI icon={Clock}         label="Avg Duration"   value={`${Math.floor(avgDur/60)}m ${avgDur%60}s`} color="#06b6d4" />
          <KPI icon={Users}         label="Subscribers"    value="12.4K"  sub="+193 this week"  color="#1e78ff" change={4}  />
          <KPI icon={Share2}        label="Total Shares"   value="8.2K"   sub="all time"        color="#a855f7" change={22} />
          <KPI icon={DollarSign}    label="Monthly Rev"    value={`$${grossRevenue.toLocaleString()}`} sub="est." color="#22c55e" change={12} />
        </div>

        {/* Views & Watch Time chart */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-[#e8f4ff] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#1e78ff]" /> Views & Watch Time
            </p>
            <div className="flex gap-1">
              {RANGE_OPTS.map(r => (
                <button key={r} onClick={() => setRange(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    range === r ? "bg-[#1e78ff] text-white" : "bg-[#0a1525] text-blue-400/50 hover:text-blue-300"
                  }`}>
                  {r}d
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={viewsData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="sa-gViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1e78ff" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#1e78ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="sa-gWatch" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00c8ff" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00c8ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#3a6080" }} tickLine={false} interval={range > 30 ? 13 : 5} />
              <YAxis tick={{ fontSize: 10, fill: "#3a6080" }} tickLine={false} axisLine={false} />
              <Tooltip content={<CyberTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#4a7ea0" }} />
              <Area type="monotone" dataKey="views"       name="Views"     stroke="#1e78ff" fill="url(#sa-gViews)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="watch_hours" name="Watch Hrs" stroke="#00c8ff" fill="url(#sa-gWatch)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </section>

      <Divider label="Content" />

      {/* ── 2. CONTENT PERFORMANCE ───────────────────────────────────────── */}
      <section>
        <SectionHeader icon={Star} title="Content Performance" color="#f59e0b" />

        <div className="grid lg:grid-cols-2 gap-5 mb-5">
          {/* Top Videos */}
          <Card>
            <p className="text-sm font-bold text-[#e8f4ff] mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" /> Top Videos
            </p>
            <div className="space-y-3">
              {displayTopVideos.map((v, i) => (
                <div key={v.id ?? i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-blue-500/40 w-4 flex-shrink-0">#{i + 1}</span>
                  <div className="w-12 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-[#0a1525] border border-blue-900/30">
                    {v.thumbnail_url && <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#c8dff5] truncate">{v.title}</p>
                    <p className="text-xs text-blue-400/50 mt-0.5">{fmt(v.view_count)} views · {fmt(v.like_count)} likes</p>
                  </div>
                  <div className="w-20 h-1.5 bg-[#0a1525] rounded-full overflow-hidden flex-shrink-0">
                    <div className="h-full bg-gradient-to-r from-[#1e78ff] to-[#00c8ff] rounded-full"
                      style={{ width: `${Math.round(((v.view_count || 0) / maxViews) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Retention Curve */}
          <Card>
            <p className="text-sm font-bold text-[#e8f4ff] mb-1 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" /> Audience Retention
            </p>
            <p className="text-xs text-blue-400/40 mb-4">Avg % of video still watching</p>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={RETENTION_CURVE} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="sa-gRet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                <XAxis dataKey="pct" tick={{ fontSize: 10, fill: "#3a6080" }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#3a6080" }} tickLine={false} axisLine={false} unit="%" />
                <Tooltip content={<CyberTooltip />} />
                <Area type="monotone" dataKey="viewers" name="% Watching" stroke="#22c55e" fill="url(#sa-gRet)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-xs text-green-400 font-semibold mt-2">68% avg retention — above platform avg (55%)</p>
          </Card>
        </div>

        {/* Content Breakdown Table + Category Chart */}
        <div className="grid lg:grid-cols-2 gap-5">
          <Card>
            <p className="text-sm font-bold text-[#e8f4ff] mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-yellow-400" /> Views by Category
            </p>
            {catChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={catChartData} layout="vertical" barSize={13} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#3a6080" }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#3a6080" }} tickLine={false} width={72} />
                  <Tooltip content={<CyberTooltip />} />
                  <Bar dataKey="views" name="Views" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={MOCK_CONTENT.map(c => ({ name: c.title.slice(0, 12), views: c.views }))} layout="vertical" barSize={13} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#3a6080" }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#3a6080" }} tickLine={false} width={72} />
                  <Tooltip content={<CyberTooltip />} />
                  <Bar dataKey="views" name="Views" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card>
            <p className="text-sm font-bold text-[#e8f4ff] mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#a855f7]" /> Content Breakdown
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-blue-900/30">
                  <th className="text-left py-2 pr-2 text-blue-400/40 font-medium">Title</th>
                  <th className="text-right py-2 px-2 text-blue-400/40 font-medium">Views</th>
                  <th className="text-right py-2 px-2 text-blue-400/40 font-medium">Ret%</th>
                  <th className="text-right py-2 pl-2 text-blue-400/40 font-medium">Shares</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_CONTENT.map((row, i) => (
                  <tr key={i} className="border-b border-blue-900/20 hover:bg-blue-900/10 transition-colors">
                    <td className="py-2.5 pr-2 text-[#c8dff5] font-medium max-w-[130px] truncate">{row.title}</td>
                    <td className="py-2.5 px-2 text-right text-blue-400/60">{row.views.toLocaleString()}</td>
                    <td className="py-2.5 px-2 text-right text-green-400 font-bold">{row.retention}%</td>
                    <td className="py-2.5 pl-2 text-right text-[#a855f7] font-bold">{row.shares}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </section>

      <Divider label="Audience" />

      {/* ── 3. AUDIENCE ─────────────────────────────────────────────────── */}
      <section>
        <SectionHeader icon={Users} title="Audience Insights" color="#06b6d4" />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <KPI icon={Clock}     label="Avg Watch Time"  value="6.8m"  sub="per session"        color="#06b6d4" change={5}  />
          <KPI icon={BarChart2} label="Poll Rate"       value="26%"   sub="avg participation"  color="#a855f7" change={3}  />
          <KPI icon={ThumbsUp}  label="Like Ratio"      value="5.6×"  sub="likes per comment"  color="#f97316" change={8}  />
          <KPI icon={Eye}       label="Weekly Views"    value="15.0K" sub="+18% last week"      color="#22c55e" change={18} />
        </div>

        <div className="grid lg:grid-cols-2 gap-5 mb-5">
          {/* Radar */}
          <Card>
            <p className="text-sm font-bold text-[#e8f4ff] mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#1e78ff]" /> Engagement Score
            </p>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={MOCK_RADAR} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="#0d2040" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "#4a7ea0" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar name="Score" dataKey="value" stroke="#1e78ff" fill="#1e78ff" fillOpacity={0.18} strokeWidth={2} />
                <Tooltip content={<CyberTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>

          {/* Traffic Sources */}
          <Card>
            <p className="text-sm font-bold text-[#e8f4ff] mb-5 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#00c8ff]" /> Traffic Sources
            </p>
            <div className="space-y-3.5">
              {TRAFFIC_SOURCES.map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#9fc3e8]">{s.source}</span>
                    <span className="text-[#1e78ff] font-bold">{s.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-[#0a1525] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#1e78ff] to-[#00c8ff]" style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Weekly Engagement Trends */}
        <Card>
          <p className="text-sm font-bold text-[#e8f4ff] mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#a855f7]" /> Weekly Engagement Trends
          </p>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={MOCK_WEEKLY} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#3a6080" }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#3a6080" }} tickLine={false} axisLine={false} />
              <Tooltip content={<CyberTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#4a7ea0" }} />
              <Line type="monotone" dataKey="watchH"     name="Watch Hrs"   stroke="#1e78ff" strokeWidth={2} dot={{ fill: "#1e78ff", r: 3 }} />
              <Line type="monotone" dataKey="pollRate"   name="Poll Rate %"  stroke="#a855f7" strokeWidth={2} dot={{ fill: "#a855f7", r: 3 }} />
              <Line type="monotone" dataKey="engagement" name="Engagement"   stroke="#f97316" strokeWidth={2} dot={{ fill: "#f97316", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </section>

      <Divider label="Revenue" />

      {/* ── 4. REVENUE ──────────────────────────────────────────────────── */}
      <section>
        <SectionHeader icon={DollarSign} title="Revenue & Financials" color="#22c55e" />

        {/* Revenue Banner */}
        <div className="bg-gradient-to-r from-[#1e78ff]/15 to-[#a855f7]/15 border border-[#1e78ff]/25 rounded-2xl p-5 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <p className="text-blue-400/60 text-xs mb-1">Gross Revenue This Month</p>
              <p className="text-4xl font-black text-[#e8f4ff]">${grossRevenue.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2 bg-[#1e78ff]/15 border border-[#1e78ff]/30 rounded-xl px-3 py-2 w-fit">
              <TrendingUp className="w-3.5 h-3.5 text-[#1e78ff]" />
              <span className="text-xs font-bold text-[#1e78ff]">+12% vs last month</span>
            </div>
          </div>
          <div className="bg-[#03080f]/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-3 h-3 text-blue-400/40" />
              <span className="text-blue-400/40 text-xs">80% creator · 20% platform</span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden mb-3 border border-blue-900/30">
              <div className="bg-[#1e78ff]" style={{ width: "80%" }} />
              <div className="bg-blue-900/40" style={{ width: "20%" }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-blue-400/40 text-xs">Your Earnings</p>
                <p className="text-xl font-black text-[#e8f4ff]">${creatorEarnings.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-400/40 text-xs">Platform Fee</p>
                <p className="text-xl font-black text-blue-500/40">${(grossRevenue - creatorEarnings).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue stream KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {MOCK_REVENUE.map((r, i) => (
            <KPI key={i} icon={r.icon} label={r.name} value={`$${r.value}`} color={r.color} change={r.change} />
          ))}
        </div>

        {/* Revenue Trend */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-[#e8f4ff]">Revenue Trends</p>
            <div className="flex gap-1">
              {["3m", "6m", "7m"].map(r => (
                <button key={r} onClick={() => setRevenueRange(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    revenueRange === r ? "bg-[#1e78ff] text-white" : "bg-[#0a1525] text-blue-400/50 hover:text-blue-300"
                  }`}>
                  {r === "7m" ? "All" : r}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={displayMonthly} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="sa-rg-b" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1e78ff" stopOpacity={0.3} /><stop offset="95%" stopColor="#1e78ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="sa-rg-p" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.3} /><stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="sa-rg-o" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f97316" stopOpacity={0.3} /><stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="sa-rg-g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#3a6080" }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#3a6080" }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip content={<CyberTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#4a7ea0" }} />
              <Area type="monotone" dataKey="memberships" name="Memberships" stroke="#1e78ff" fill="url(#sa-rg-b)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="tips"        name="Tips"        stroke="#a855f7" fill="url(#sa-rg-p)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="products"    name="Products"    stroke="#f97316" fill="url(#sa-rg-o)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="ads"         name="Ads"         stroke="#22c55e" fill="url(#sa-rg-g)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </section>

      <Divider label="Growth" />

      {/* ── 5. GROWTH ───────────────────────────────────────────────────── */}
      <section>
        <SectionHeader icon={TrendingUp} title="Growth & Reach" color="#22c55e" />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <KPI icon={Users}      label="Total Subs"      value="12.4K" sub="+193 this week"   color="#1e78ff" change={4}  />
          <KPI icon={TrendingUp} label="Sub Growth Rate" value="+1.6%" sub="week over week"   color="#22c55e" change={12} />
          <KPI icon={Zap}        label="Viral Score"     value="74"    sub="out of 100"       color="#a855f7" change={9}  />
          <KPI icon={Radio}      label="Live Viewers"    value="832"   sub="avg peak"         color="#f97316" change={15} />
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <Card>
            <p className="text-sm font-bold text-[#e8f4ff] mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#1e78ff]" /> Subscriber Growth
            </p>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={viewsData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="sa-gSubs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#3a6080" }} tickLine={false} interval={range > 30 ? 13 : 5} />
                <YAxis tick={{ fontSize: 10, fill: "#3a6080" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CyberTooltip />} />
                <Area type="monotone" dataKey="subs_gained" name="New Subs" stroke="#22c55e" fill="url(#sa-gSubs)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <p className="text-sm font-bold text-[#e8f4ff] mb-4 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#a855f7]" /> Weekly Subs & Views
            </p>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={MOCK_WEEKLY} barSize={14} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#3a6080" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#3a6080" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CyberTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#4a7ea0" }} />
                <Bar dataKey="subs"  name="New Subs" fill="#1e78ff"  radius={[4, 4, 0, 0]} />
                <Bar dataKey="views" name="Views"    fill="#a855f7"  radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </section>

      <Divider label="Planning" />

      {/* ── 6. BEST TIMES & PLANNING ────────────────────────────────────── */}
      <section>
        <SectionHeader icon={Calendar} title="Best Times & Planning" color="#1e78ff" />

        <Card className="mb-5">
          <p className="text-sm font-bold text-[#e8f4ff] mb-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1e78ff]" /> Best Times to Post / Go Live
          </p>
          <p className="text-xs text-blue-400/40 mb-4">Based on audience activity patterns — higher score = more viewers online</p>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={BEST_TIMES} barSize={20} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#3a6080" }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#3a6080" }} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip content={<CyberTooltip />} />
              <Bar dataKey="score" name="Audience Score" fill="#1e78ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-[#1e78ff] font-bold mt-2">⚡ Peak: 8 PM — best time to go live or premiere</p>
        </Card>

        <div className="grid lg:grid-cols-2 gap-5">
          <Card>
            <p className="text-sm font-bold text-[#e8f4ff] mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-green-400" /> Upload Strategy Tips
            </p>
            <div className="space-y-2.5">
              {STRATEGY_TIPS.map((t, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-[#0a1525] border border-blue-900/30 rounded-xl">
                  <span className="text-xs font-bold text-[#1e78ff] bg-[#1e78ff]/15 rounded-lg px-1.5 py-0.5 flex-shrink-0 tabular-nums">{t.score}</span>
                  <p className="text-xs text-[#9fc3e8]">{t.tip}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="text-sm font-bold text-[#e8f4ff] mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" /> Format Retention Rates
            </p>
            <div className="space-y-4">
              {CONTENT_FORMATS.map((f, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#c8dff5]">{f.format}</span>
                    <span className="text-[#1e78ff] font-bold">{f.retention}%</span>
                  </div>
                  <div className="h-2 bg-[#0a1525] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#1e78ff] to-[#00c8ff]" style={{ width: `${f.retention}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

    </div>
  );
}