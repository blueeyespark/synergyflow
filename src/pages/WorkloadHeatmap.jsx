import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, AlertTriangle, CheckCircle, Clock, TrendingUp, Calendar } from "lucide-react";
import { format, addDays, startOfWeek, isWithinInterval, parseISO, isPast, isToday } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

const CAPACITY = 5; // tasks per person per day considered "full"

function getHeatColor(count) {
  if (count === 0) return { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-400", label: "Empty" };
  if (count <= 1) return { bg: "bg-green-100 dark:bg-green-900/40", text: "text-green-700 dark:text-green-300", label: "Light" };
  if (count <= 2) return { bg: "bg-yellow-100 dark:bg-yellow-900/40", text: "text-yellow-700 dark:text-yellow-300", label: "Moderate" };
  if (count <= 3) return { bg: "bg-orange-100 dark:bg-orange-900/40", text: "text-orange-700 dark:text-orange-300", label: "Busy" };
  if (count <= CAPACITY) return { bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-300", label: "Heavy" };
  return { bg: "bg-red-600 dark:bg-red-700", text: "text-white", label: "Overloaded" };
}

export default function WorkloadHeatmap() {
  const [weeksAhead, setWeeksAhead] = useState(0);

  const weekStart = startOfWeek(addDays(new Date(), weeksAhead * 7), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: tasks = [] } = useQuery({ queryKey: ["all-tasks"], queryFn: () => base44.entities.Task.list() });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => base44.entities.Project.list() });

  const members = useMemo(() => {
    const emails = new Set(tasks.map(t => t.assigned_to).filter(Boolean));
    return [...emails];
  }, [tasks]);

  const activeTasks = tasks.filter(t => t.status !== "completed");

  // For each member+day: count tasks due that day or active without due date bucketed to today
  const getTasksForMemberDay = (email, day) => {
    return activeTasks.filter(t => {
      if (t.assigned_to !== email) return false;
      if (!t.due_date) return isToday(day);
      const due = parseISO(t.due_date + "T12:00:00");
      return format(due, "yyyy-MM-dd") === format(day, "yyyy-MM-dd");
    });
  };

  // Stats
  const overloaded = members.filter(email => {
    return days.some(day => getTasksForMemberDay(email, day).length > CAPACITY);
  });
  const underutil = members.filter(email => {
    return days.every(day => getTasksForMemberDay(email, day).length === 0);
  });
  const overdueCount = activeTasks.filter(t => t.due_date && isPast(parseISO(t.due_date + "T12:00:00")) && !isToday(parseISO(t.due_date + "T12:00:00"))).length;

  const getProjectColor = (projectId) => {
    const colors = ["#6366f1","#22c55e","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899","#14b8a6"];
    const idx = projects.findIndex(p => p.id === projectId);
    return colors[idx % colors.length] || "#94a3b8";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Workload Heatmap</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Team allocation and capacity visualization by day</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeeksAhead(w => w - 1)} className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">← Prev</button>
            <button onClick={() => setWeeksAhead(0)} className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">This Week</button>
            <button onClick={() => setWeeksAhead(w => w + 1)} className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Next →</button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Team Members", value: members.length, icon: Users, color: "text-indigo-600 bg-indigo-100" },
            { label: "Overloaded", value: overloaded.length, icon: AlertTriangle, color: "text-red-600 bg-red-100" },
            { label: "Under-utilized", value: underutil.length, icon: TrendingUp, color: "text-amber-600 bg-amber-100" },
            { label: "Overdue Tasks", value: overdueCount, icon: Clock, color: "text-orange-600 bg-orange-100" },
          ].map(({ label, value, icon: Icon, color }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Intensity:</span>
          {[
            { label: "Empty", bg: "bg-slate-100 dark:bg-slate-800" },
            { label: "Light (1)", bg: "bg-green-100 dark:bg-green-900/40" },
            { label: "Moderate (2)", bg: "bg-yellow-100 dark:bg-yellow-900/40" },
            { label: "Busy (3)", bg: "bg-orange-100 dark:bg-orange-900/40" },
            { label: "Heavy (4-5)", bg: "bg-red-100 dark:bg-red-900/40" },
            { label: "Overloaded (5+)", bg: "bg-red-600 dark:bg-red-700" },
          ].map(({ label, bg }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${bg} border border-slate-200 dark:border-slate-600`} />
              <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
            </div>
          ))}
        </div>

        {/* Heatmap Grid */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-auto">
          {members.length === 0 ? (
            <div className="p-16 text-center text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No assigned tasks yet</p>
              <p className="text-sm mt-1">Assign tasks to team members to see the heatmap</p>
            </div>
          ) : (
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 w-40">Member</th>
                  {days.map(day => (
                    <th key={day.toISOString()} className={`px-2 py-3 text-xs font-semibold text-center ${isToday(day) ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"}`}>
                      <div>{format(day, "EEE")}</div>
                      <div className={`text-lg font-bold mt-0.5 ${isToday(day) ? "text-indigo-600 dark:text-indigo-400" : "text-slate-800 dark:text-slate-200"}`}>
                        {format(day, "d")}
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 text-center">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {members.map(email => {
                  const weekTotal = days.reduce((s, day) => s + getTasksForMemberDay(email, day).length, 0);
                  const isOverloaded = days.some(d => getTasksForMemberDay(email, d).length > CAPACITY);
                  return (
                    <tr key={email} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-300 flex-shrink-0">
                            {email.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[100px]">{email.split("@")[0]}</p>
                            {isOverloaded && <span className="text-xs text-red-500 font-medium">⚠ Overloaded</span>}
                          </div>
                        </div>
                      </td>
                      {days.map(day => {
                        const dayTasks = getTasksForMemberDay(email, day);
                        const { bg, text, label } = getHeatColor(dayTasks.length);
                        return (
                          <td key={day.toISOString()} className="px-1 py-2 text-center">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className={`mx-auto w-11 h-11 rounded-xl ${bg} flex items-center justify-center text-sm font-bold ${text} cursor-default border border-white/50 dark:border-slate-600/50 transition-transform hover:scale-110`}>
                                    {dayTasks.length || ""}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="font-semibold mb-1">{email.split("@")[0]} — {format(day, "MMM d")} ({label})</p>
                                  {dayTasks.length === 0 ? <p className="text-xs">No tasks due</p> : (
                                    <ul className="text-xs space-y-0.5">
                                      {dayTasks.map(t => (
                                        <li key={t.id} className="flex items-center gap-1.5">
                                          <span style={{ color: getProjectColor(t.project_id) }}>●</span>
                                          {t.title}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-center">
                        <span className={`text-sm font-bold ${weekTotal > CAPACITY * 5 ? "text-red-600" : weekTotal > 3 ? "text-amber-600" : "text-slate-600 dark:text-slate-400"}`}>
                          {weekTotal}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Over-allocated warnings */}
        {overloaded.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-100 dark:border-red-900">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Over-allocation detected
            </p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-1">
              {overloaded.join(", ")} have days exceeding {CAPACITY} tasks. Consider redistributing workload.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}