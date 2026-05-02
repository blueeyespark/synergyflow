import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout, MessageSquare, Calendar, Users, Settings, Clock, LayoutDashboard } from "lucide-react";
import PlanningOverview from "@/components/studio/PlanningOverview";
import Templates from "@/pages/Templates";
import ContentHub from "./ContentHub";
import CalendarPage from "@/pages/Calendar";
import Meetings from "@/pages/Meetings";
import Planner from "@/pages/Planner";
import TimeTrackingAnalytics from "@/pages/TimeTrackingAnalytics";
import ContentCalendarStudio from "./ContentCalendarStudio";

const subtabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, component: PlanningOverview },
  { id: "templates", label: "Templates", icon: Layout, component: Templates },
  { id: "calendar", label: "Content Calendar", icon: Calendar, component: ContentCalendarStudio },
  { id: "schedule", label: "Schedule", icon: Clock, component: CalendarPage },
  { id: "meetings", label: "Meetings", icon: Users, component: Meetings },
  { id: "planner", label: "Planner", icon: Settings, component: Planner },
  { id: "time-tracking", label: "Time Tracking", icon: Clock, component: TimeTrackingAnalytics },
];

export default function PlanningHub() {
  const [active, setActive] = useState("overview");
  const ActiveComponent = subtabs.find(t => t.id === active)?.component;

  return (
    <div>
      <Tabs value={active} onValueChange={setActive}>
        <TabsList className="mb-6 flex flex-wrap gap-1 h-auto">
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