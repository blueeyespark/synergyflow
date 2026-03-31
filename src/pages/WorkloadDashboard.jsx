import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Users, AlertTriangle, CheckCircle, RefreshCw, Loader2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const DEFAULT_CAPACITY = 5;

function CapacityBar({ assigned, capacity }) {
  const pct = Math.min((assigned / capacity) * 100, 100);
  const over = assigned > capacity;
  const under = assigned < capacity * 0.4;
  const color = over ? "bg-red-500" : under ? "bg-slate-300" : "bg-green-500";
  return (
    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
      <div className={`h-2 rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
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
  const balanced = members.filter(m => {
    const c = getCapacity(m.email);
    return m.tasks.length <= c && m.tasks.length >= c * 0.4 && m.email !== "__unassigned__";
  });

  const generateSuggestions = async () => {
    setLoadingSuggestions(true);
    const summary = members.map(m =>
      `${m.email === "__unassigned__" ? "Unassigned" : m.email.split("@")[0]}: ${m.tasks.length} tasks (capacity: ${getCapacity(m.email)})`
    ).join(", ");
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Project management advisor. Team workload:\n${summary}\n\nSuggest specific task reassignments for over-allocated members. Be concise, bullet points only.`,
    });
    setSuggestions(result);
    setLoadingSuggestions(false);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newEmail = destination.droppableId === "__unassigned__" ? null : destination.droppableId;
    updateMutation.mutate({ id: draggableId, data: { assigned_to: newEmail } });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Workload Balancer</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Drag tasks between members to rebalance. Red = overbooked.</p>
          </div>
          <Button onClick={generateSuggestions} disabled={loadingSuggestions} variant="outline">
            {loadingSuggestions ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            AI Suggestions
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Users, label: "Team Members", value: members.filter(m => m.email !== "__unassigned__").length, color: "bg-indigo-500" },
            { icon: AlertTriangle, label: "Overbooked 🔴", value: overAllocated.filter(m => m.email !== "__unassigned__").length, color: "bg-red-500" },
            { icon: CheckCircle, label: "Balanced", value: balanced.length, color: "bg-green-500" },
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

        {suggestions && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-5">
            <h3 className="font-semibold text-indigo-800 dark:text-indigo-300 mb-2">✨ AI Rebalancing Suggestions</h3>
            <pre className="text-sm text-indigo-700 dark:text-indigo-300 whitespace-pre-wrap font-sans leading-relaxed">{suggestions}</pre>
          </div>
        )}

        {/* Drag-and-drop balancer */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map(member => {
              const cap = getCapacity(member.email);
              const isOver = member.tasks.length > cap;
              const name = member.email === "__unassigned__" ? "Unassigned" : member.email.split("@")[0];

              return (
                <div key={member.email} className={`rounded-2xl border shadow-sm p-4 transition-colors ${
                  isOver && member.email !== "__unassigned__"
                    ? "border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800"
                    : "border-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                        isOver && member.email !== "__unassigned__"
                          ? "bg-red-200 text-red-700"
                          : "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300"
                      }`}>
                        {name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className={`font-medium text-sm ${isOver && member.email !== "__unassigned__" ? "text-red-700 dark:text-red-400" : "text-slate-800 dark:text-slate-100"}`}>
                          {name}
                          {isOver && member.email !== "__unassigned__" && " 🔴"}
                        </p>
                        <p className="text-xs text-slate-400">{member.tasks.length}/{cap} tasks</p>
                      </div>
                    </div>
                    <input
                      type="number" min={1} max={20} value={cap}
                      onChange={e => setCapacities(prev => ({ ...prev, [member.email]: parseInt(e.target.value) || 1 }))}
                      className="w-10 text-center border border-slate-200 dark:border-slate-600 rounded-lg px-1 py-0.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs"
                      title="Capacity"
                    />
                  </div>
                  <CapacityBar assigned={member.tasks.length} capacity={cap} />

                  <Droppable droppableId={member.email}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`mt-3 space-y-1.5 min-h-[60px] rounded-lg p-1 transition-colors ${snapshot.isDraggingOver ? "bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-300" : ""}`}
                      >
                        {member.tasks.map((task, idx) => (
                          <Draggable key={task.id} draggableId={task.id} index={idx}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition-shadow ${
                                  snapshot.isDragging
                                    ? "shadow-lg bg-white dark:bg-slate-700 border-indigo-300"
                                    : "bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600 hover:border-slate-200"
                                }`}
                              >
                                <GripVertical className="w-3 h-3 text-slate-300 flex-shrink-0" />
                                <span className="truncate text-slate-700 dark:text-slate-200">{task.title}</span>
                                {task.priority === 'urgent' || task.priority === 'high' ? (
                                  <span className="ml-auto text-red-400 flex-shrink-0">!</span>
                                ) : null}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {member.tasks.length === 0 && (
                          <p className="text-xs text-slate-300 dark:text-slate-600 text-center py-2">Drop tasks here</p>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}