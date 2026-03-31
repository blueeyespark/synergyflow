import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, AlertTriangle, CheckCircle, ArrowRight, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const DEFAULT_CAPACITY = 5; // tasks per person default

function CapacityBar({ assigned, capacity }) {
  const pct = Math.min((assigned / capacity) * 100, 100);
  const over = assigned > capacity;
  const under = assigned < capacity * 0.4;
  const color = over ? "bg-red-500" : under ? "bg-slate-300" : "bg-green-500";
  return (
    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
      <div className={`h-2.5 rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatusBadge({ assigned, capacity }) {
  if (assigned > capacity) return <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400">Over-allocated</Badge>;
  if (assigned < capacity * 0.4) return <Badge className="bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-400">Under-utilized</Badge>;
  return <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400">Balanced</Badge>;
}

export default function WorkloadDashboard() {
  const [capacities, setCapacities] = useState({});
  const [suggestions, setSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["workload-tasks"],
    queryFn: () => base44.entities.Task.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workload-tasks"] });
      toast.success("Task reassigned");
    },
  });

  // Build member workload map
  const members = useMemo(() => {
    const map = {};
    tasks.filter(t => t.status !== "completed").forEach(t => {
      const email = t.assigned_to || "__unassigned__";
      if (!map[email]) map[email] = { email, tasks: [] };
      map[email].tasks.push(t);
    });
    return Object.values(map).sort((a, b) => b.tasks.length - a.tasks.length);
  }, [tasks]);

  const getCapacity = (email) => capacities[email] ?? DEFAULT_CAPACITY;

  const overAllocated = members.filter(m => m.tasks.length > getCapacity(m.email));
  const underUtilized = members.filter(m => m.tasks.length < getCapacity(m.email) * 0.4 && m.email !== "__unassigned__");

  const generateSuggestions = async () => {
    setLoadingSuggestions(true);
    const summary = members.map(m =>
      `${m.email === "__unassigned__" ? "Unassigned" : m.email.split("@")[0]}: ${m.tasks.length} tasks (capacity: ${getCapacity(m.email)})`
    ).join(", ");

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a project management advisor. Here is the current team workload:\n${summary}\n\nIdentify who is over-allocated (tasks > capacity) and under-utilized (tasks < 40% capacity). Suggest specific task reassignments. Be concise and actionable. Format as bullet points.`,
    });
    setSuggestions(result);
    setLoadingSuggestions(false);
  };

  const reassignTask = (taskId, toEmail) => {
    updateMutation.mutate({ id: taskId, data: { assigned_to: toEmail } });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Workload Dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Compare team capacity vs. active task load</p>
          </div>
          <Button onClick={generateSuggestions} disabled={loadingSuggestions} variant="outline">
            {loadingSuggestions ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            AI Rebalance Suggestions
          </Button>
        </div>

        {/* Summary chips */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Users, label: "Team Members", value: members.filter(m => m.email !== "__unassigned__").length, color: "bg-indigo-500" },
            { icon: AlertTriangle, label: "Over-allocated", value: overAllocated.length, color: "bg-red-500" },
            { icon: CheckCircle, label: "Balanced", value: members.length - overAllocated.length - underUtilized.length, color: "bg-green-500" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 flex items-center gap-3 shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* AI Suggestions */}
        {suggestions && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-5">
            <h3 className="font-semibold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-2">
              ✨ AI Rebalancing Suggestions
            </h3>
            <pre className="text-sm text-indigo-700 dark:text-indigo-300 whitespace-pre-wrap font-sans leading-relaxed">{suggestions}</pre>
          </div>
        )}

        {/* Member Workload Cards */}
        <div className="space-y-3">
          {members.map(member => {
            const cap = getCapacity(member.email);
            const name = member.email === "__unassigned__" ? "Unassigned" : member.email.split("@")[0];
            const isOver = member.tasks.length > cap;
            const underMembers = members.filter(m => m.email !== "__unassigned__" && m.tasks.length < getCapacity(m.email) && m.email !== member.email);

            return (
              <div key={member.email} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-semibold text-sm">
                      {name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">{name}</p>
                      <p className="text-xs text-slate-400">{member.tasks.length} active tasks</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge assigned={member.tasks.length} capacity={cap} />
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <span>Cap:</span>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={cap}
                        onChange={e => setCapacities(prev => ({ ...prev, [member.email]: parseInt(e.target.value) || 1 }))}
                        className="w-12 text-center border border-slate-200 dark:border-slate-600 rounded-lg px-1 py-0.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs"
                      />
                    </div>
                  </div>
                </div>
                <CapacityBar assigned={member.tasks.length} capacity={cap} />
                <p className="text-xs text-slate-400 mt-1.5">{member.tasks.length} / {cap} capacity</p>

                {/* Tasks list */}
                <div className="mt-3 space-y-1.5">
                  {member.tasks.slice(0, 4).map(task => (
                    <div key={task.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-slate-700 dark:text-slate-300 truncate">{task.title}</span>
                      {isOver && underMembers.length > 0 && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <select
                            defaultValue=""
                            onChange={e => e.target.value && reassignTask(task.id, e.target.value)}
                            className="text-xs border border-slate-200 dark:border-slate-600 rounded-lg px-1 py-0.5 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                          >
                            <option value="">Reassign…</option>
                            {underMembers.map(m => (
                              <option key={m.email} value={m.email}>{m.email.split("@")[0]}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                  {member.tasks.length > 4 && (
                    <p className="text-xs text-slate-400">+{member.tasks.length - 4} more tasks</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}