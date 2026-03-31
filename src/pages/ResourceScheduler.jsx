import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Zap, CheckCircle, Loader2, RefreshCw, UserCheck, AlertTriangle, TrendingUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, isPast, isToday } from "date-fns";
import { toast } from "sonner";

const CAPACITY = 5;

function LoadBar({ value, max = CAPACITY }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = value >= max ? "bg-red-500" : value >= max * 0.75 ? "bg-amber-500" : value >= max * 0.4 ? "bg-blue-500" : "bg-green-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-medium w-8 ${value >= max ? "text-red-600" : "text-slate-500"}`}>{value}/{max}</span>
    </div>
  );
}

export default function ResourceScheduler() {
  const queryClient = useQueryClient();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(null);

  const { data: tasks = [] } = useQuery({ queryKey: ["all-tasks"], queryFn: () => base44.entities.Task.list() });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => base44.entities.Project.list() });
  const { data: timeEntries = [] } = useQuery({ queryKey: ["time-entries"], queryFn: () => base44.entities.TimeEntry.list() });

  const updateTask = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["all-tasks"] }),
  });

  // Build member stats
  const memberStats = useMemo(() => {
    const emails = [...new Set(tasks.map(t => t.assigned_to).filter(Boolean))];
    // Also include members from projects
    projects.forEach(p => (p.team_members || []).forEach(e => { if (e && !emails.includes(e)) emails.push(e); }));

    return emails.map(email => {
      const activeTasks = tasks.filter(t => t.assigned_to === email && t.status !== 'completed');
      const overdueTasks = activeTasks.filter(t => t.due_date && isPast(parseISO(t.due_date + 'T12:00:00')) && !isToday(parseISO(t.due_date + 'T12:00:00')));
      const completedTasks = tasks.filter(t => t.assigned_to === email && t.status === 'completed');
      const totalHours = timeEntries.filter(e => e.user_email === email).reduce((s, e) => s + (e.duration_seconds || 0) / 3600, 0);
      const load = activeTasks.length;
      const available = Math.max(0, CAPACITY - load);
      const completionRate = (activeTasks.length + completedTasks.length) > 0
        ? Math.round((completedTasks.length / (activeTasks.length + completedTasks.length)) * 100) : 0;

      return { email, activeTasks, overdueTasks, completedTasks, totalHours, load, available, completionRate };
    });
  }, [tasks, projects, timeEntries]);

  const unassignedTasks = tasks.filter(t => !t.assigned_to && t.status !== 'completed');

  const generateSuggestions = async () => {
    setLoading(true);
    setSuggestions([]);

    if (unassignedTasks.length === 0 && memberStats.every(m => m.load <= CAPACITY)) {
      toast.info("Team is well-balanced — no reassignments needed!");
      setLoading(false);
      return;
    }

    const statsText = memberStats.map(m =>
      `${m.email.split('@')[0]}: ${m.load} active tasks, ${m.available} slots free, ${m.completionRate}% completion rate, ${m.overdueTasks.length} overdue`
    ).join('\n');

    const unassignedText = unassignedTasks.slice(0, 15).map(t => {
      const proj = projects.find(p => p.id === t.project_id);
      return `ID:${t.id} "${t.title}" (${t.priority || 'medium'} priority, project: ${proj?.name || 'N/A'}, due: ${t.due_date || 'none'})`;
    }).join('\n');

    const overloadedText = memberStats.filter(m => m.load > CAPACITY).map(m =>
      `${m.email.split('@')[0]} has ${m.load} tasks (${m.load - CAPACITY} over capacity)`
    ).join('\n');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a resource scheduling AI for a project management tool. Analyze team workload and suggest optimal task assignments.

TEAM AVAILABILITY (capacity = ${CAPACITY} tasks/person):
${statsText || 'No team data available'}

UNASSIGNED TASKS (${unassignedTasks.length} total):
${unassignedText || 'None'}

OVERLOADED MEMBERS:
${overloadedText || 'None'}

Generate up to 8 specific assignment suggestions. For each:
- Suggest assigning an unassigned task OR reassigning from an overloaded member
- Pick the best available person based on capacity and completion rate
- Provide a clear 1-sentence reason

Return JSON only.`,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                task_id: { type: "string" },
                task_title: { type: "string" },
                assign_to: { type: "string" },
                from_email: { type: "string" },
                reason: { type: "string" },
                type: { type: "string" }
              }
            }
          },
          summary: { type: "string" }
        }
      }
    });

    setSuggestions(result?.suggestions || []);
    setLoading(false);
    if (result?.suggestions?.length === 0) toast.info("Team looks well-balanced!");
    else toast.success(`${result.suggestions.length} suggestions generated`);
  };

  const applySuggestion = async (s) => {
    setApplying(s.task_id);
    const task = tasks.find(t => t.id === s.task_id);
    if (task) {
      await updateTask.mutateAsync({ id: s.task_id, data: { assigned_to: s.assign_to } });
      toast.success(`Assigned "${task.title}" to ${s.assign_to.split('@')[0]}`);
      setSuggestions(prev => prev.filter(x => x.task_id !== s.task_id));
    } else {
      toast.error("Task not found");
    }
    setApplying(null);
  };

  const applyAll = async () => {
    for (const s of suggestions) {
      await applySuggestion(s);
    }
    toast.success("All suggestions applied!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/20 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Resource Scheduler</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">AI-powered task assignment based on availability & performance</p>
          </div>
          <div className="flex gap-2">
            {suggestions.length > 0 && (
              <Button variant="outline" onClick={applyAll} className="text-green-700 border-green-300">
                <CheckCircle className="w-4 h-4 mr-1.5" /> Apply All ({suggestions.length})
              </Button>
            )}
            <Button onClick={generateSuggestions} disabled={loading} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
              {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Zap className="w-4 h-4 mr-1.5" />}
              {loading ? "Analyzing..." : "Generate Suggestions"}
            </Button>
          </div>
        </div>

        {/* Team Overview */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {memberStats.map(m => (
            <motion.div key={m.email} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  m.load >= CAPACITY ? "bg-red-100 text-red-600" : m.load === 0 ? "bg-green-100 text-green-600" : "bg-indigo-100 text-indigo-600"
                }`}>
                  {m.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{m.email.split('@')[0]}</p>
                  <p className="text-xs text-slate-400 truncate">{m.email}</p>
                </div>
                {m.load >= CAPACITY && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                {m.load === 0 && <span className="text-xs text-green-600 font-medium">Available</span>}
              </div>
              <LoadBar value={m.load} />
              <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{m.completionRate}% completion rate</span>
                <span>{m.overdueTasks.length > 0 && <span className="text-red-500">{m.overdueTasks.length} overdue</span>}</span>
                <span>{m.totalHours.toFixed(0)}h logged</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Unassigned tasks banner */}
        {unassignedTasks.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{unassignedTasks.length} unassigned tasks</p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">Click "Generate Suggestions" to auto-assign based on team capacity</p>
            </div>
          </div>
        )}

        {/* Suggestions */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <h2 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-500" /> AI Suggestions
                </h2>
                <Badge variant="secondary">{suggestions.length} pending</Badge>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-700">
                {suggestions.map((s, i) => {
                  const fromMember = memberStats.find(m => m.email === s.from_email);
                  const toMember = memberStats.find(m => m.email === s.assign_to);
                  return (
                    <motion.div key={s.task_id || i} layout
                      className="px-5 py-4 flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{s.task_title}</span>
                          <Badge variant="outline" className="text-xs capitalize">{s.type || "assign"}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                          {s.from_email && <><span className="font-medium">{s.from_email.split('@')[0]}</span><ChevronRight className="w-3 h-3" /></>}
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{s.assign_to?.split('@')[0]}</span>
                          {toMember && <span className="text-slate-400">({toMember.available} slots free)</span>}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">{s.reason}</p>
                      </div>
                      <Button size="sm" onClick={() => applySuggestion(s)}
                        disabled={applying === s.task_id}
                        className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700">
                        {applying === s.task_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5 mr-1" />}
                        Apply
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && suggestions.length === 0 && memberStats.length > 0 && (
          <div className="text-center py-16 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Click "Generate Suggestions" to analyze your team</p>
            <p className="text-sm mt-1">AI will suggest optimal task assignments based on workload and performance</p>
          </div>
        )}
      </div>
    </div>
  );
}