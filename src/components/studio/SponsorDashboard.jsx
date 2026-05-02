import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Zap, MessageSquare, Link as LinkIcon, TrendingUp } from "lucide-react";

export default function SponsorDashboard() {
  const [user, setUser] = useState(null);
  useState(() => { base44.auth.me().then(setUser); }, []);

  const activeSponsorships = [
    { id: 1, brand: "TechGear Pro", amount: 5000, duration: "3 months", status: "active", startDate: "2026-02-01" },
    { id: 2, brand: "StreamLabs", amount: 2500, duration: "Monthly", status: "active", startDate: "2026-04-01" },
    { id: 3, brand: "Elgato", amount: 3000, duration: "6 months", status: "pending", startDate: "2026-05-15" },
  ];

  const opportunities = [
    { brand: "Brand A", budget: "$1000-$5000", fit: "88%", contact: "Contact" },
    { brand: "Brand B", budget: "$5000-$10000", fit: "75%", contact: "Contact" },
    { brand: "Brand C", budget: "$500-$2000", fit: "92%", contact: "Contact" },
  ];

  return (
    <div className="space-y-6">
      {/* Sponsorship Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Active Deals", value: activeSponsorships.filter(s => s.status === "active").length, color: "text-green-400" },
          { label: "Monthly Revenue", value: "$10.5K", color: "text-blue-400" },
          { label: "Pending Offers", value: activeSponsorships.filter(s => s.status === "pending").length, color: "text-yellow-400" },
          { label: "Inquiry Rate", value: "3/month", color: "text-purple-400" },
        ].map((stat, i) => (
          <div key={i} className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4">
            <p className="text-xs text-blue-400/60 mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Active Sponsorships */}
      <section>
        <h2 className="text-xl font-black text-[#e8f4ff] mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Active Sponsorships
        </h2>
        <div className="space-y-3">
          {activeSponsorships.map(s => (
            <div key={s.id} className="bg-[#060d18] border border-blue-900/40 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-[#e8f4ff]">{s.brand}</p>
                  <p className="text-xs text-blue-400/60">{s.duration} • Started {s.startDate}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  s.status === "active" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                }`}>
                  {s.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-lg font-black text-blue-300">${s.amount.toLocaleString()}</p>
                <button className="text-xs bg-blue-900/20 text-blue-300 hover:bg-blue-900/40 px-3 py-1.5 rounded-lg transition-colors">
                  Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sponsor Opportunities */}
      <section>
        <h2 className="text-xl font-black text-[#e8f4ff] mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          Incoming Opportunities
        </h2>
        <div className="space-y-2">
          {opportunities.map((opp, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-[#060d18] border border-blue-900/40 rounded-lg">
              <div>
                <p className="text-sm font-semibold text-[#c8dff5]">{opp.brand}</p>
                <p className="text-xs text-blue-400/60">{opp.budget}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-green-400">{opp.fit} match</span>
                <button className="text-xs bg-[#1e78ff] hover:bg-[#3d8fff] text-white px-3 py-1.5 rounded-lg transition-colors">
                  {opp.contact}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sponsorship Terms Template */}
      <section>
        <h2 className="text-xl font-black text-[#e8f4ff] mb-4 flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-cyan-400" />
          Sponsorship Media Kit
        </h2>
        <div className="bg-[#060d18] border border-blue-900/40 rounded-xl p-5">
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-blue-400/60 text-xs mb-1">Channel Stats</p>
              <p className="text-[#c8dff5]">50K subscribers • 2.1M monthly views • 8.5% engagement rate</p>
            </div>
            <div>
              <p className="text-blue-400/60 text-xs mb-1">Audience Demographics</p>
              <p className="text-[#c8dff5]">18-34 (68%) • Tech-savvy • Gaming & streaming enthusiasts</p>
            </div>
            <div>
              <p className="text-blue-400/60 text-xs mb-1">Sponsorship Options</p>
              <p className="text-[#c8dff5]">Video integrations • Stream overlays • Description links • Exclusive codes</p>
            </div>
          </div>
          <button className="mt-4 w-full bg-[#1e78ff] hover:bg-[#3d8fff] text-white font-semibold py-2 rounded-lg transition-colors text-sm">
            Download Media Kit PDF
          </button>
        </div>
      </section>
    </div>
  );
}