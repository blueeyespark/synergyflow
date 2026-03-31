import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Activity, CheckSquare, Clock, ArrowRight, Plus, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const ACTION_CONFIG = {
  status_changed: { icon: ArrowRight, color: "bg-blue-100 text-blue-600", label: "Status changed" },
  created:        { icon: Plus,       color: "bg-green-100 text-green-600", label: "Created" },
  updated:        { icon: ArrowRight, color: "bg-amber-100 text-amber-600", label: "Updated" },
  deleted:        { icon: ArrowRight, color: "bg-red-100 text-red-600", label: "Deleted" },
  completed:      { icon: CheckSquare, color: "bg-green-100 text-green-600", label: "Completed" },
  commented:      { icon: Activity,   color: "bg-purple-100 text-purple-600", label: "Commented" },
  assigned:       { icon: Activity,   color: "bg-indigo-100 text-indigo-600", label: "Assigned" },
};

export default function ActivityFeed({ projects = [], userEmail }) {
  const [filterProject, setFilterProject] = useState("all");
  const [filterMember, setFilterMember] = useState(userEmail || "all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["activity-logs"],
    queryFn: () => base44.entities.ActivityLog.list("-created_date", 100),
    refetchInterval: 30000,
  });

  // Also pull recent time entries as activity
  const { data: timeEntries = [] } = useQuery({
    queryKey: ["activity-time-entries"],
    queryFn: () => base44.entities.TimeEntry.list("-created_date", 30),
    refetchInterval: 60000,
  });

  // Merge logs + time entries into a unified feed
  const timeActivity = timeEntries
    .filter(e => e.duration_seconds > 0)
    .map(e => ({
      id: `te-${e.id}`,
      action: "created",
      entity_type: "time_entry",
      entity_name: e.task_title || "Time entry",
      user_email: e.user_email,
      user_name: e.user_email?.split("@")[0],
      parent_id: e.project_id,
      created_date: e.created_date,
      changes: { duration: e.duration_seconds, project: e.project_name },
    }));

  const allActivity = [
    ...logs.map(l => ({ ...l, id: `log-${l.id}` })),
    ...timeActivity,
  ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  // Collect unique members
  const members = [...new Set(allActivity.map(a => a.user_email).filter(Boolean))];

  const filtered = allActivity.filter(a => {
    if (filterProject !== "all" && a.parent_id !== filterProject) return false;
    if (filterMember !== "all" && a.user_email !== filterMember) return false;
    return a.user_email === userEmail;
  }).slice(0, 50);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-500" /> Activity Feed
        </h3>
        <div className="flex items-center gap-2">
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="h-7 text-xs w-32 border-slate-200">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {userEmail && (
            <span className="text-xs text-slate-500 px-2">Your activity</span>
          )}
        </div>
      </div>

      <div className="divide-y divide-slate-50 dark:divide-slate-700 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map(i => <div key={i} className="animate-pulse h-10 bg-slate-100 rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No activity yet</p>
          </div>
        ) : (
          filtered.map(item => {
            const cfg = ACTION_CONFIG[item.action] || ACTION_CONFIG.updated;
            const Icon = cfg.icon;
            const isTimeEntry = item.entity_type === "time_entry";
            return (
              <div key={item.id} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isTimeEntry ? "bg-indigo-100 text-indigo-600" : cfg.color}`}>
                  {isTimeEntry ? <Clock className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-200">
                    <span className="font-medium">{item.user_name || item.user_email?.split("@")[0] || "Someone"}</span>
                    {" "}
                    {isTimeEntry
                      ? `logged time on "${item.entity_name}"`
                      : `${item.action?.replace("_", " ")} "${item.entity_name}"`}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.entity_type && (
                      <Badge variant="outline" className="text-xs py-0 capitalize">{item.entity_type.replace("_", " ")}</Badge>
                    )}
                    <span className="text-xs text-slate-400">
                      {item.created_date ? formatDistanceToNow(parseISO(item.created_date), { addSuffix: true }) : ""}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}