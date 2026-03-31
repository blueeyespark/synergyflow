import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, List, LayoutGrid, BarChart3, Calendar, Flag, User, Loader2, Timer, Square, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, isPast, isToday, parseISO } from "date-fns";
import TaskForm from "@/components/tasks/TaskForm";
import GanttChart from "@/components/gantt/GanttChart";
import { toast } from "sonner";

const COLUMNS = [
  { id: "todo",        label: "To Do",       color: "bg-slate-100 dark:bg-slate-800",      dot: "bg-slate-400",  border: "border-slate-300 dark:border-slate-600",  header: "text-slate-600 dark:text-slate-300" },
  { id: "in_progress", label: "In Progress",  color: "bg-blue-50 dark:bg-blue-950/40",     dot: "bg-blue-500",   border: "border-blue-200 dark:border-blue-800",    header: "text-blue-700 dark:text-blue-300" },
  { id: "review",      label: "In Review",    color: "bg-amber-50 dark:bg-amber-950/40",   dot: "bg-amber-500",  border: "border-amber-200 dark:border-amber-800",  header: "text-amber-700 dark:text-amber-300" },
  { id: "completed",   label: "Done",         color: "bg-green-50 dark:bg-green-950/40",   dot: "bg-green-500",  border: "border-green-200 dark:border-green-800",  header: "text-green-700 dark:text-green-300" },
];

const STATUS_BORDER = { todo: "border-l-slate-400", in_progress: "border-l-blue-500", review: "border-l-amber-500", completed: "border-l-green-500" };
const STATUS_BG = { todo: "", in_progress: "bg-blue-50/50 dark:bg-blue-950/20", review: "bg-amber-50/50 dark:bg-amber-950/20", completed: "bg-green-50/50 dark:bg-green-950/20" };

const PRIORITY_COLOR = { urgent: "text-red-600", high: "text-orange-500", medium: "text-amber-500", low: "text-slate-400" };

function TaskChip({ task, onEdit, provided }) {
  const overdue = task.due_date && isPast(parseISO(task.due_date + "T12:00:00")) && !isToday(parseISO(task.due_date + "T12:00:00")) && task.status !== "completed";
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const startRef = useRef(null);

  const startTimer = (e) => {
    e.stopPropagation();
    startRef.current = Date.now() - elapsed * 1000;
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    setRunning(true);
  };

  const stopTimer = async (e) => {
    e.stopPropagation();
    clearInterval(timerRef.current);
    setRunning(false);
    if (elapsed > 5) {
      await base44.entities.TimeEntry.create({
        task_id: task.id,
        task_title: task.title,
        project_id: task.project_id,
        user_email: 'me',
        start_time: new Date(Date.now() - elapsed * 1000).toISOString(),
        end_time: new Date().toISOString(),
        duration_seconds: elapsed,
        is_billable: true,
      });
      toast.success(`Logged ${Math.floor(elapsed / 60)}m ${elapsed % 60}s`);
    }
    setElapsed(0);
  };

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={() => onEdit(task)}
      className={`bg-white dark:bg-slate-800 border-l-4 ${STATUS_BORDER[task.status] || 'border-l-slate-300'} border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm hover:shadow-md cursor-pointer transition-all space-y-2 ${STATUS_BG[task.status] || ''}`}
    >
      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug">{task.title}</p>
      <div className="flex items-center gap-2 flex-wrap">
        {task.priority && (
          <span className={`flex items-center gap-1 text-xs font-medium ${PRIORITY_COLOR[task.priority]}`}>
            <Flag className="w-3 h-3" />{task.priority}
          </span>
        )}
        {task.due_date && (
          <span className={`flex items-center gap-1 text-xs ${overdue ? "text-red-500 font-semibold" : "text-slate-400"}`}>
            <Calendar className="w-3 h-3" />{format(parseISO(task.due_date + "T12:00:00"), "MMM d")}
          </span>
        )}
        {task.assigned_to && (
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <User className="w-3 h-3" />{task.assigned_to.split("@")[0]}
          </span>
        )}
      </div>
      {task.steps?.length > 0 && (
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1">
          <div className="bg-indigo-500 h-1 rounded-full"
            style={{ width: `${Math.round((task.steps.filter(s => s.completed).length / task.steps.length) * 100)}%` }} />
        </div>
      )}
      {/* Stopwatch */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
        <span className={`text-xs font-mono ${running ? 'text-green-600 dark:text-green-400 font-bold' : 'text-slate-400'}`}>
          {running || elapsed > 0 ? fmt(elapsed) : <Timer className="w-3 h-3" />}
        </span>
        <button
          onClick={running ? stopTimer : startTimer}
          className={`p-1 rounded-md text-xs flex items-center gap-1 transition-colors ${running ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600'}`}
        >
          {running ? <><Square className="w-3 h-3" /> Stop</> : <><Play className="w-3 h-3" /> Track</>}
        </button>
      </div>
    </div>
  );
}

export default function Tasks() {
  const [view, setView] = useState("kanban");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const [autoPrioritizing, setAutoPrioritizing] = useState(false);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["all-tasks", user?.email],
    queryFn: () => base44.entities.Task.list("-created_date"),
    enabled: !!user?.email,
    select: (data) => data.filter(t =>
      t.created_by === user?.email || t.assigned_to === user?.email
    ),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["all-tasks"] }),
    onError: () => toast.error("Failed to update task"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["all-tasks"] }); setShowForm(false); toast.success("Task created"); },
  });

  const autoPrioritize = async () => {
    if (!tasks.length) return;
    setAutoPrioritizing(true);
    toast.loading("Analyzing tasks...", { id: "autoprio" });
    const taskSummaries = tasks.filter(t => t.status !== 'completed').map(t => ({
      id: t.id,
      title: t.title,
      due_date: t.due_date || null,
      status: t.status,
      current_priority: t.priority,
    }));
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a task prioritization engine. Analyze these tasks and assign a priority (high, medium, or low) to each one based on:
- Due date urgency (closer = higher priority)
- Current status (todo > in_progress > review)
- Task title keywords indicating urgency

Tasks: ${JSON.stringify(taskSummaries)}

Return ONLY the JSON — no markdown, no explanation.`,
      response_json_schema: {
        type: "object",
        properties: {
          priorities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                priority: { type: "string", enum: ["high", "medium", "low"] },
                reason: { type: "string" }
              }
            }
          }
        }
      }
    });
    let updated = 0;
    for (const p of (result?.priorities || [])) {
      const task = tasks.find(t => t.id === p.id);
      if (task && task.priority !== p.priority) {
        await base44.entities.Task.update(p.id, { priority: p.priority });
        updated++;
      }
    }
    queryClient.invalidateQueries({ queryKey: ["all-tasks"] });
    toast.success(`Auto-prioritized ${updated} task${updated !== 1 ? 's' : ''}`, { id: "autoprio" });
    setAutoPrioritizing(false);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    const task = tasks.find(t => t.id === draggableId);
    if (!task || task.status === newStatus) return;
    updateMutation.mutate({
      id: draggableId,
      data: { status: newStatus, completed_at: newStatus === "completed" ? new Date().toISOString() : null },
    });
  };

  const handleSubmit = (data) => {
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data });
      setEditingTask(null);
      setShowForm(false);
      toast.success("Task updated");
    } else {
      createMutation.mutate(data);
    }
  };

  const tasksByStatus = (status) => tasks.filter(t => t.status === status);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">All Tasks</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{tasks.length} tasks across {projects.length} projects</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 gap-1">
              {[
                { id: "kanban", icon: LayoutGrid },
                { id: "list",   icon: List },
                { id: "gantt",  icon: BarChart3 },
              ].map(({ id, icon: Icon }) => (
                <button key={id} onClick={() => setView(id)}
                  className={`p-1.5 rounded-md transition-colors ${view === id ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"}`}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={autoPrioritize} disabled={autoPrioritizing} className="gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
              {autoPrioritizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Auto-Prioritize
            </Button>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" />New Task
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : view === "kanban" ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {COLUMNS.map(col => (
                <div key={col.id} className={`${col.color} rounded-2xl p-3 flex flex-col gap-2`}>
                  <div className={`flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg border ${col.border}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dot} shadow-sm`} />
                    <span className={`text-xs font-bold ${col.header} uppercase tracking-widest`}>{col.label}</span>
                    <span className={`ml-auto text-xs font-semibold px-1.5 py-0.5 rounded-full bg-white/70 dark:bg-slate-800/70 ${col.header}`}>{tasksByStatus(col.id).length}</span>
                  </div>
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex flex-col gap-2 min-h-[120px] rounded-xl transition-colors ${snapshot.isDraggingOver ? "bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-300 dark:ring-indigo-700" : ""}`}
                      >
                        {tasksByStatus(col.id).map((task, idx) => (
                          <Draggable key={task.id} draggableId={task.id} index={idx}>
                            {(provided) => (
                              <TaskChip task={task} onEdit={(t) => { setEditingTask(t); setShowForm(true); }} provided={provided} />
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        ) : view === "list" ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            {tasks.length === 0 ? (
              <div className="text-center py-16 text-slate-400">No tasks yet. Create one!</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                    <th className="text-left px-5 py-3 font-medium">Task</th>
                    <th className="text-left px-3 py-3 font-medium hidden sm:table-cell">Project</th>
                    <th className="text-left px-3 py-3 font-medium hidden md:table-cell">Assignee</th>
                    <th className="text-left px-3 py-3 font-medium">Status</th>
                    <th className="text-left px-3 py-3 font-medium hidden lg:table-cell">Due</th>
                    <th className="text-left px-3 py-3 font-medium hidden md:table-cell">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                  {tasks.map(task => {
                    const project = projects.find(p => p.id === task.project_id);
                    const overdue = task.due_date && isPast(parseISO(task.due_date + "T12:00:00")) && task.status !== "completed";
                    return (
                      <tr key={task.id} onClick={() => { setEditingTask(task); setShowForm(true); }}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                        <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100">{task.title}</td>
                        <td className="px-3 py-3 text-slate-500 dark:text-slate-400 hidden sm:table-cell">{project?.name || "—"}</td>
                        <td className="px-3 py-3 text-slate-500 dark:text-slate-400 hidden md:table-cell">{task.assigned_to?.split("@")[0] || "—"}</td>
                        <td className="px-3 py-3">
                          <Badge variant="outline" className="text-xs capitalize">{task.status?.replace("_", " ")}</Badge>
                        </td>
                        <td className={`px-3 py-3 hidden lg:table-cell text-xs ${overdue ? "text-red-500 font-semibold" : "text-slate-400"}`}>
                          {task.due_date ? format(parseISO(task.due_date + "T12:00:00"), "MMM d") : "—"}
                        </td>
                        <td className={`px-3 py-3 hidden md:table-cell text-xs capitalize ${PRIORITY_COLOR[task.priority] || "text-slate-400"}`}>
                          {task.priority || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <GanttChart tasks={tasks} onTaskUpdate={(id, updates) => updateMutation.mutate({ id, data: updates })} />
        )}
      </div>

      <TaskForm
        open={showForm}
        onOpenChange={(o) => { setShowForm(o); if (!o) setEditingTask(null); }}
        task={editingTask}
        projects={projects}
        allTasks={tasks}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}