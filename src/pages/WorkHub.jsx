import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, FolderKanban, CheckSquare, FolderOpen, LayoutTemplate } from "lucide-react";
import CalendarPage from "@/pages/Calendar";
import Projects from "@/pages/Projects";
import Tasks from "@/pages/Tasks";
import PlannerPage from "@/pages/Planner";
import Templates from "@/pages/Templates";

const TABS = [
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "planner", label: "Planners", icon: FolderOpen },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
];

export default function WorkHub() {
  const [activeTab, setActiveTab] = useState("calendar");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sticky tab bar */}
      <div className="sticky top-16 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-12 bg-transparent border-0 gap-0 rounded-none">
              {TABS.map(t => (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="flex items-center gap-1.5 px-5 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                >
                  <t.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "calendar" && <CalendarPage />}
        {activeTab === "projects" && <Projects />}
        {activeTab === "tasks" && <Tasks />}
        {activeTab === "planner" && <PlannerPage />}
        {activeTab === "templates" && <Templates />}
      </div>
    </div>
  );
}