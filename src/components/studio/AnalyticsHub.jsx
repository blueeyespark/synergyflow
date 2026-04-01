import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Video, FileText, DollarSign, Trophy, LayoutDashboard } from "lucide-react";
import AnalyticsOverview from "@/components/studio/AnalyticsOverview";
import ContentAnalytics from "@/pages/ContentAnalytics";
import VideoAnalytics from "@/pages/VideoAnalytics";
import Reports from "@/pages/Reports";
import BudgetPage from "@/pages/Budget";
import Leaderboard from "@/pages/Leaderboard";

const subtabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, component: AnalyticsOverview },
  { id: "content", label: "Content Analytics", icon: BarChart3, component: ContentAnalytics },
  { id: "video", label: "Video Analytics", icon: Video, component: VideoAnalytics },
  { id: "reports", label: "Reports", icon: FileText, component: Reports },
  { id: "budget", label: "Budget", icon: DollarSign, component: BudgetPage },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy, component: Leaderboard },
];

export default function AnalyticsHub() {
  const [active, setActive] = useState("overview");
  const ActiveComponent = subtabs.find(t => t.id === active)?.component;

  return (
    <div>
      <Tabs value={active} onValueChange={setActive}>
        <TabsList className="mb-6">
          {subtabs.map(t => (
            <TabsTrigger key={t.id} value={t.id} className="gap-2">
              <t.icon className="w-4 h-4" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div>{ActiveComponent && <ActiveComponent />}</div>
      </Tabs>
    </div>
  );
}