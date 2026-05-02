import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, Gift, Zap, Eye } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function MonetizationRevenue() {
  const [user, setUser] = useState(null);
  useState(() => { base44.auth.me().then(setUser); }, []);

  const { data: superChats = [] } = useQuery({
    queryKey: ["super-chats-revenue"],
    queryFn: () => base44.entities.SuperChat.filter({ payment_status: "completed" }, "-created_date", 50),
  });

  const { data: budget = [] } = useQuery({
    queryKey: ["revenue-tracking"],
    queryFn: () => base44.entities.CreatorBudget.filter({ type: "income" }, "-date", 30),
  });

  const totalSuperChatRevenue = superChats.reduce((s, sc) => s + (sc.amount || 0), 0);
  const totalIncomeTracked = budget.reduce((s, b) => s + (b.amount || 0), 0);

  const revenueChartData = [
    { month: "Week 1", super_chat: 240, subs: 400, ads: 240 },
    { month: "Week 2", super_chat: 221, subs: 350, ads: 280 },
    { month: "Week 3", super_chat: 229, subs: 450, ads: 300 },
    { month: "Week 4", super_chat: 200, subs: 500, ads: 220 },
  ];

  const monetizationOptions = [
    { name: "Super Chat", revenue: totalSuperChatRevenue, desc: "Fan donations", icon: Gift, status: "active" },
    { name: "Channel Subscriptions", revenue: 1200, desc: "Recurring subs", icon: Zap, status: "active" },
    { name: "Ad Revenue", revenue: 845, desc: "YouTube ads", icon: Eye, status: "active" },
    { name: "Sponsorships", revenue: 500, desc: "Brand deals", icon: DollarSign, status: "inactive" },
  ];

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {monetizationOptions.map((opt, i) => {
          const Icon = opt.icon;
          return (
            <div key={i} className={`bg-[#060d18] border rounded-xl p-4 ${opt.status === "active" ? "border-blue-900/40" : "border-blue-900/20 opacity-60"}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-green-400" />
                <span className="text-xs text-blue-400/60">{opt.name}</span>
              </div>
              <p className="text-2xl font-black text-[#e8f4ff]">${opt.revenue}</p>
              <p className="text-xs text-blue-400/50 mt-1">{opt.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue Breakdown Chart */}
      <section className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4">
        <h3 className="text-sm font-bold mb-4 text-[#e8f4ff]">Revenue Breakdown (4 Weeks)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a3a60" />
            <XAxis dataKey="month" stroke="#4a7ea0" />
            <YAxis stroke="#4a7ea0" />
            <Tooltip contentStyle={{ background: "#0d1820", border: "1px solid #1a3a60" }} />
            <Bar dataKey="super_chat" fill="#fbbf24" name="Super Chat" />
            <Bar dataKey="subs" fill="#1e78ff" name="Subscriptions" />
            <Bar dataKey="ads" fill="#00c8ff" name="Ads" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Top Super Chat Donors */}
      <section>
        <h2 className="text-xl font-black text-[#e8f4ff] mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-yellow-400" />
          Top Supporters
        </h2>
        <div className="space-y-2">
          {superChats.slice(0, 5).map((sc, i) => (
            <div key={sc.id} className="flex items-center justify-between p-3 bg-[#060d18] border border-blue-900/40 rounded-lg">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-bold text-yellow-400">#{i + 1}</span>
                <p className="text-sm font-semibold text-[#c8dff5] truncate">{sc.sender_name}</p>
              </div>
              <span className="text-sm font-bold text-yellow-400 flex-shrink-0">${sc.amount}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Monetization Setup */}
      <section>
        <h2 className="text-xl font-black text-[#e8f4ff] mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-400" />
          Monetization Setup
        </h2>
        <div className="space-y-3">
          {[
            { name: "YouTube Partner Program", status: "active", desc: "Enables ads, Super Chat, memberships" },
            { name: "Channel Memberships", status: "active", desc: "Monthly recurring revenue" },
            { name: "Sponsorships", status: "pending", desc: "Brand partnership deals" },
            { name: "Affiliate Links", status: "inactive", desc: "Product recommendations" },
          ].map((feature, i) => (
            <div key={i} className="p-3 bg-[#060d18] border border-blue-900/40 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#e8f4ff]">{feature.name}</p>
                  <p className="text-xs text-blue-400/60 mt-1">{feature.desc}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  feature.status === "active" ? "bg-green-500/20 text-green-400" :
                  feature.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-slate-500/20 text-slate-400"
                }`}>
                  {feature.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Revenue Goals */}
      <section>
        <h2 className="text-xl font-black text-[#e8f4ff] mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          Monthly Goals
        </h2>
        <div className="space-y-2">
          {[
            { goal: "$500/month", progress: 72, desc: "Current: $360" },
            { goal: "$1000/month", progress: 36, desc: "Current: $360" },
            { goal: "$2000/month", progress: 18, desc: "Current: $360" },
          ].map((g, i) => (
            <div key={i} className="p-3 bg-[#060d18] border border-blue-900/40 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-[#e8f4ff]">{g.goal}</p>
                <p className="text-xs text-blue-400/60">{g.progress}%</p>
              </div>
              <div className="h-2 bg-blue-900/20 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#1e78ff] to-[#00c8ff]" style={{ width: `${g.progress}%` }} />
              </div>
              <p className="text-xs text-blue-400/50 mt-1">{g.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}