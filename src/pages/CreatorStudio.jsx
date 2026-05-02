import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Upload, BarChart3, Calendar, Users, ArrowLeft, TrendingUp, Edit3, Zap
} from "lucide-react";
import ProductionHub from "@/components/studio/ProductionHub";
import PlanningHub from "@/components/studio/PlanningHub";
import AnalyticsHub from "@/components/studio/AnalyticsHub";
import ChannelEditor from "@/components/studio/ChannelEditor";
import IntegrationsHub from "@/components/studio/IntegrationsHub";
import ContentCreationHub from "@/components/studio/ContentCreationHub";
import MonetizationHub from "@/components/studio/MonetizationHub";
import CommunityManagementHub from "@/components/studio/CommunityManagementHub";
import CreatorResourcesHub from "@/components/studio/CreatorResourcesHub";
import CollaborationHub from "@/components/studio/CollaborationHub";
import AdvancedAnalyticsHub from "@/components/studio/AdvancedAnalyticsHub";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const tabs = [
  { 
    id: "channel", 
    label: "Channel", 
    icon: Edit3, 
    component: null,
    subtabs: [
      { id: "edit", label: "Edit Channel", component: ChannelEditor },
      { id: "integrations", label: "Integrations", component: IntegrationsHub },
    ]
  },
  { 
    id: "production", 
    label: "Production", 
    icon: Upload, 
    component: ProductionHub,
  },
  { 
    id: "planning", 
    label: "Planning", 
    icon: Calendar, 
    component: PlanningHub,
  },
  { 
    id: "analytics", 
    label: "Analytics", 
    icon: BarChart3, 
    component: null,
    subtabs: [
      { id: "analytics", label: "Analytics", component: AnalyticsHub },
      { id: "deep", label: "Deep Dive", component: AdvancedAnalyticsHub },
      { id: "monetization", label: "Monetization", component: MonetizationHub },
      { id: "community", label: "Community", component: CommunityManagementHub },
      { id: "resources", label: "Resources", component: CreatorResourcesHub },
      { id: "collaboration", label: "Collaboration", component: CollaborationHub },
    ]
  },
];

export default function CreatorStudio() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get("tab") || "production";
  const [activeTab, setActiveTab] = useState(tabParam);
  const [activeSubtab, setActiveSubtab] = useState("edit");

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const { data: channels = [] } = useQuery({
    queryKey: ["channels-all"],
    queryFn: () => base44.entities.Channel.list(),
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
  });

  const myChannels = channels.filter(c => c.creator_email === user?.email);

  // Gate: must have at least one channel
  if (!loading && user && myChannels.length === 0) {
    return (
      <div className="min-h-screen bg-background dark:bg-[#03080f] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1e78ff]/20 to-[#a855f7]/20 border border-blue-900/40 flex items-center justify-center mx-auto mb-5">
            <Users className="w-9 h-9 text-blue-400/40" />
          </div>
          <h2 className="text-2xl font-black text-[#e8f4ff] mb-2">No Channel Yet</h2>
          <p className="text-blue-400/50 text-sm mb-6">You need a channel before you can access Creator Studio.</p>
          <Link to="/Channel">
            <Button className="gap-2 w-full"><Zap className="w-4 h-4" /> Create a Channel</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen bg-background dark:bg-[#03080f] flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background dark:bg-[#03080f] text-foreground dark:text-[#e8f4ff]">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-blue-900/40 bg-white dark:bg-[#03080f]/90 backdrop-blur-sm sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top row */}
          <div className="flex items-center gap-4 pt-4 pb-2">
            <Link
              to="/Channel"
              className="flex items-center gap-1.5 text-sm font-semibold text-blue-400 hover:text-blue-200 bg-blue-900/20 hover:bg-blue-900/30 border border-blue-900/40 rounded-lg px-3 py-1.5 transition-all flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              My Channel
            </Link>
            <div className="flex-1" />
            <div>
              <div>
                <h1 className="text-xl font-black tracking-wide" style={{ background: 'linear-gradient(135deg,#1e78ff,#00c8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Creator Studio
                </h1>
              <p className="text-xs text-blue-500/60">Manage your channel, content, and team</p>
            </div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-0.5 overflow-x-auto scrollbar-hide">
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
        {(() => {
          const activeTabData = tabs.find(t => t.id === activeTab);
          if (!activeTabData) return null;

          // Tabs without subtabs - render directly
          if (!activeTabData.subtabs && activeTabData.component) {
            const Component = activeTabData.component;
            return <Component />;
          }

          // Tabs with subtabs - render tabbed interface
          if (activeTabData.subtabs) {
            const defaultSubtab = activeSubtab && activeTabData.subtabs.find(s => s.id === activeSubtab) ? activeSubtab : activeTabData.subtabs[0].id;
            return (
              <Tabs value={activeSubtab || defaultSubtab} onValueChange={setActiveSubtab}>
                <TabsList className="mb-6 flex flex-wrap gap-1 h-auto">
                  {activeTabData.subtabs.map(subtab => (
                    <TabsTrigger key={subtab.id} value={subtab.id}>
                      {subtab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {activeTabData.subtabs.map(subtab => {
                  const SubComponent = subtab.component;
                  return (
                    <TabsContent key={subtab.id} value={subtab.id}>
                      <SubComponent />
                    </TabsContent>
                  );
                })}
              </Tabs>
            );
          }

          return null;
        })()}
      </div>
    </div>
  );
}