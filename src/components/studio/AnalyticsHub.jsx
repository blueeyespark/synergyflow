import { useState } from "react";
import { BarChart3, DollarSign } from "lucide-react";
import StreamerAnalytics from "./StreamerAnalytics";
import MonetizationRevenue from "./MonetizationRevenue";

const subtabs = [
  { id: "performance", label: "Performance", icon: BarChart3, component: StreamerAnalytics },
  { id: "revenue", label: "Revenue", icon: DollarSign, component: MonetizationRevenue },
];

export default function AnalyticsHub() {
  const [activeTab, setActiveTab] = useState("performance");
  const ActiveComponent = subtabs.find(t => t.id === activeTab)?.component;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-blue-900/30">
        {subtabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 -mb-px transition-all ${
                activeTab === tab.id ? "border-[#1e78ff] text-[#1e78ff]" : "border-transparent text-blue-400/60 hover:text-blue-300"
              }`}>
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>
      {ActiveComponent && <ActiveComponent />}
    </div>
  );
}