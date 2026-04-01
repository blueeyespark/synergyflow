import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Globe, Bot, Upload, BarChart3, Calendar, Users, ImageIcon } from "lucide-react";
import ContentProductionHub from "@/components/studio/ContentProductionHub";
import MediaLibrary from "./MediaLibrary";
import ChannelPage from "./ChannelPage";
import Dashboard from "./Dashboard";

import ClientPortal from "./ClientPortal";
import DiscordBot from "./DiscordBot";

import AnalyticsHub from "@/components/studio/AnalyticsHub";
import PlanningHub from "@/components/studio/PlanningHub";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, component: Dashboard },
  { id: "channel", label: "My Channel", icon: Users, component: ChannelPage },
  { id: "production", label: "Content Production", icon: Upload, component: ContentProductionHub },
  { id: "media", label: "Media Library", icon: ImageIcon, component: MediaLibrary },

  { id: "planning", label: "Planning", icon: Calendar, component: PlanningHub },
  { id: "analytics", label: "Analytics", icon: BarChart3, component: AnalyticsHub },

  { id: "client-portal", label: "Client Portal", icon: Globe, component: ClientPortal },
  { id: "discord-bot", label: "Discord Bot", icon: Bot, component: DiscordBot },
];

export default function CreatorStudio() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold text-slate-900">Creator Studio</h1>
          <p className="text-slate-500 mt-2">Everything you need to create, publish, and grow your content</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto">
              <TabsList className="inline-flex w-full gap-1 p-4 bg-slate-50 rounded-t-2xl border-b border-slate-200">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center gap-1.5 text-xs sm:text-sm font-medium px-2 sm:px-3 py-2 rounded-lg transition-colors data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white whitespace-nowrap"
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <div className="p-6">
              {tabs.map((tab) => (
                <div key={tab.id} className={activeTab === tab.id ? "block" : "hidden"}>
                  <tab.component />
                </div>
              ))}
            </div>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}