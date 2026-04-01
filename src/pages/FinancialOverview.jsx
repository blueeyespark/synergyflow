import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { DollarSign, TrendingUp, Users, ShoppingBag, Heart, ArrowUpRight, ArrowDownRight } from "lucide-react";

const MOCK_MONTHLY = [
  { month: "Oct", memberships: 420, tips: 180, products: 95, ads: 310 },
  { month: "Nov", memberships: 480, tips: 210, products: 120, ads: 340 },
  { month: "Dec", memberships: 610, tips: 390, products: 210, ads: 420 },
  { month: "Jan", memberships: 570, tips: 280, products: 175, ads: 380 },
  { month: "Feb", memberships: 640, tips: 320, products: 240, ads: 410 },
  { month: "Mar", memberships: 720, tips: 410, products: 295, ads: 490 },
  { month: "Apr", memberships: 810, tips: 460, products: 340, ads: 530 },
];

const MOCK_BREAKDOWN = [
  { name: "Channel Memberships", value: 810, color: "#06b6d4", icon: Users, change: +12.5 },
  { name: "Tips & Super Chats", value: 460, color: "#a855f7", icon: Heart, change: +8.2 },
  { name: "Product Sales", value: 340, color: "#f97316", icon: ShoppingBag, change: +15.7 },
  { name: "Ad Revenue", value: 530, color: "#22c55e", icon: DollarSign, change: +4.1 },
];

function StatCard({ label, value, change, color, icon: Icon }) {
  const positive = change >= 0;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-zinc-400">{label}</span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + "22" }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">${value.toLocaleString()}</span>
        <span className={`flex items-center gap-0.5 text-xs font-semibold ${positive ? "text-green-500" : "text-red-500"}`}>
          {positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {Math.abs(change)}%
        </span>
      </div>
      <div className="h-1 rounded-full bg-gray-100 dark:bg-zinc-800">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (value / 1000) * 100)}%`, backgroundColor: color }} />
      </div>
    </motion.div>
  );
}

export default function FinancialOverview() {
  const [range, setRange] = useState("7m");

  const { data: budgetData = [] } = useQuery({
    queryKey: ["creator-budget"],
    queryFn: () => base44.entities.CreatorBudget.list("-date", 100),
  });

  const totalRevenue = MOCK_BREAKDOWN.reduce((s, i) => s + i.value, 0);
  const prevTotal = 1880;
  const totalChange = (((totalRevenue - prevTotal) / prevTotal) * 100).toFixed(1);

  const displayData = range === "3m" ? MOCK_MONTHLY.slice(-3) : range === "6m" ? MOCK_MONTHLY.slice(-6) : MOCK_MONTHLY;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Overview</h1>
        <p className="text-gray-500 dark:text-zinc-400 mt-1">Track your creator earnings across all revenue streams</p>
      </motion.div>

      {/* Total Banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl p-6 mb-6 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-white/70 text-sm font-medium">Total Revenue This Month</p>
          <p className="text-4xl font-black mt-1">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2 w-fit">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-bold">+{totalChange}% vs last month</span>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {MOCK_BREAKDOWN.map((item, i) => (
          <motion.div key={item.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <StatCard label={item.name} value={item.value} change={item.change} color={item.color} icon={item.icon} />
          </motion.div>
        ))}
      </div>

      {/* Revenue Trend Chart */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Revenue Trends</h2>
          <div className="flex gap-1">
            {["3m", "6m", "7m"].map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${range === r ? "bg-cyan-500 text-white" : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700"}`}>
                {r === "7m" ? "All" : r}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={displayData}>
            <defs>
              {[["cyan", "#06b6d4"], ["purple", "#a855f7"], ["orange", "#f97316"], ["green", "#22c55e"]].map(([name, color]) => (
                <linearGradient key={name} id={`grad-${name}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-zinc-800" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
            <Tooltip formatter={(v) => [`$${v}`, ""]} />
            <Legend />
            <Area type="monotone" dataKey="memberships" name="Memberships" stroke="#06b6d4" fill="url(#grad-cyan)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="tips" name="Tips" stroke="#a855f7" fill="url(#grad-purple)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="products" name="Products" stroke="#f97316" fill="url(#grad-orange)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="ads" name="Ads" stroke="#22c55e" fill="url(#grad-green)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Monthly Bar Comparison */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-6">Monthly Revenue Breakdown</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={displayData} barSize={14}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-zinc-800" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
            <Tooltip formatter={(v) => [`$${v}`, ""]} />
            <Legend />
            <Bar dataKey="memberships" name="Memberships" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            <Bar dataKey="tips" name="Tips" fill="#a855f7" radius={[4, 4, 0, 0]} />
            <Bar dataKey="products" name="Products" fill="#f97316" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ads" name="Ads" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}