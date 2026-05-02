import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, Globe, Bot, Upload, BarChart3, Calendar,
  Users, ImageIcon, ArrowLeft, DollarSign
} from "lucide-react";
import ContentProductionHub from "@/components/studio/ContentProductionHub";
import MediaLibrary from "./MediaLibrary";
import ChannelPage from "./ChannelPage";
import FinancialOverview from "./FinancialOverview";
import AudienceAnalytics from "./AudienceAnalytics";
import ClientPortal from "./ClientPortal";
import DiscordBot from "./DiscordBot";
import AnalyticsHub from "@/components/studio/AnalyticsHub";
import PlanningHub from "@/components/studio/PlanningHub";
import TeamManagement from "@/components/studio/TeamManagement";

const tabs = [
  { id: "channel",    label: "My Channel",        icon: Users,          component: ChannelPage },
  { id: "production", label: "Production",         icon: Upload,         component: ContentProductionHub },
  { id: "media",      label: "Media Library",      icon: ImageIcon,      component: MediaLibrary },
  { id: "planning",   label: "Planning",           icon: Calendar,       component: PlanningHub },
  { id: "analytics",  label: "Analytics",          icon: BarChart3,      component: AnalyticsHub },
  { id: "audience",   label: "Audience",           icon: BarChart3,      component: AudienceAnalytics },
  { id: "financials", label: "Financials",         icon: DollarSign,     component: FinancialOverview },
  { id: "team",       label: "Team",               icon: Users,          component: TeamManagement },
  { id: "client",     label: "Client Portal",      icon: Globe,          component: ClientPortal },
  { id: "discord",    label: "Discord Bot",        icon: Bot,            component: DiscordBot },
];

export default function CreatorStudio() {
  const [activeTab, setActiveTab] = useState("channel");

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component;

  return (
    <div className="min-h-screen bg-[#03080f] text-[#e8f4ff]">
      {/* Header */}
      <div className="border-b border-blue-900/40 bg-[#03080f]/90 backdrop-blur-sm sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top row: back button + title */}
          <div className="flex items-center gap-4 pt-4 pb-2">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-sm font-semibold text-blue-400 hover:text-blue-200 bg-blue-900/20 hover:bg-blue-900/30 border border-blue-900/40 rounded-lg px-3 py-1.5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <div>
              <h1 className="text-xl font-black tracking-wide" style={{ background: 'linear-gradient(135deg,#1e78ff,#00c8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Creator Studio
              </h1>
              <p className="text-xs text-blue-500/60">Manage your channel, content, and team</p>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                    isActive
                      ? "border-[#1e78ff] text-[#1e78ff]"
                      : "border-transparent text-blue-400/60 hover:text-blue-300 hover:border-blue-700/40"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          {ActiveComponent && <ActiveComponent />}
        </motion.div>
      </div>
    </div>
  );
}