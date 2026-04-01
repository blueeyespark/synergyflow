import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Play, Square, Clock, DollarSign, Download, Timer,
  Calendar, FolderKanban, ChevronDown, Trash2, FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, formatDuration, intervalToDuration, parseISO } from "date-fns";
import { toast } from "sonner";
import ProjectInvoicePanel from "@/components/billing/ProjectInvoicePanel";

function formatSeconds(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function TimeTracking() {
  const [user, setUser] = useState(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [selectedTask, setSelectedTask] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [notes, setNotes] = useState("");
  const [isBillable, setIsBillable] = useState(true);
  const [hourlyRate, setHourlyRate] = useState("100");
  const [activeEntryId, setActiveEntryId] = useState(null);
  const timerRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['time-entries', user?.email],
    queryFn: () => base44.entities.TimeEntry.filter({ user_email: user?.email }, '-created_date', 200),
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TimeEntry.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['time-entries'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TimeEntry.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['time-entries'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TimeEntry.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['time-entries'] }),
  });

  // Tick
  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [running]);

  const startTimer = async () => {
    const now = new Date().toISOString();
    setStartTime(now);
    setElapsed(0);
    setRunning(true);
    const task = tasks.find(t => t.id === selectedTask);
    const project = projects.find(p => p.id === selectedProject);
    const entry = await base44.entities.TimeEntry.create({
      task_id: selectedTask || null,
      task_title: task?.title || notes || "Manual entry",
      project_id: selectedProject || null,
      project_name: project?.name || "",
      user_email: user?.email,
      start_time: now,
      is_billable: isBillable,
      hourly_rate: parseFloat(hourlyRate) || 0,
      notes,
    });
    setActiveEntryId(entry.id);
    queryClient.invalidateQueries({ queryKey: ['time-entries'] });
  };

  const stopTimer = async () => {
    setRunning(false);
    const now = new Date().toISOString();
    if (activeEntryId) {
      await base44.entities.TimeEntry.update(activeEntryId, {
        end_time: now,
        duration_seconds: elapsed,
      });
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    }
    setElapsed(0);
    setActiveEntryId(null);
    toast.success(`Logged ${formatSeconds(elapsed)}`);
  };

  // Grouping by project
  const projectTotals = projects.map(p => {
    const pEntries = entries.filter(e => e.project_id === p.id && e.duration_seconds);
    const totalSecs = pEntries.reduce((s, e) => s + (e.duration_seconds || 0), 0);
    const billableSecs = pEntries.filter(e => e.is_billable).reduce((s, e) => s + (e.duration_seconds || 0), 0);
    const billableAmount = pEntries.filter(e => e.is_billable).reduce((s, e) => s + ((e.duration_seconds / 3600) * (e.hourly_rate || 0)), 0);
    return { ...p, totalSecs, billableSecs, billableAmount, entryCount: pEntries.length };
  }).filter(p => p.totalSecs > 0);

  const totalTracked = entries.reduce((s, e) => s + (e.duration_seconds || 0), 0);
  const totalBillable = entries.filter(e => e.is_billable).reduce((s, e) => s + ((e.duration_seconds / 3600) * (e.hourly_rate || 0)), 0);

  const exportCSV = () => {
    const rows = [
      ['Date', 'Task', 'Project', 'Duration', 'Billable', 'Rate', 'Amount', 'Notes'],
      ...entries.filter(e => e.duration_seconds).map(e => [
        format(parseISO(e.start_time), 'yyyy-MM-dd'),
        e.task_title || '',
        e.project_name || '',
        formatSeconds(e.duration_seconds),
        e.is_billable ? 'Yes' : 'No',
        e.hourly_rate || 0,
        e.is_billable ? ((e.duration_seconds / 3600) * (e.hourly_rate || 0)).toFixed(2) : 0,
        e.notes || ''
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `timesheet-${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click();
    toast.success("Timesheet exported");
  };

  const filteredTasks = selectedProject ? tasks.filter(t => t.project_id === selectedProject) : tasks;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Timer className="w-6 h-6 text-indigo-600" /> Time Tracking
            </h1>
            <p className="text-sm text-slate-500 mt-1">Track billable hours per project</p>
          </div>
          <Button variant="outline" onClick={exportCSV} className="gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </Button>
        </motion.div>

        {/* Timer Widget */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 space-y-3 w-full">
              <div className="grid sm:grid-cols-2 gap-3">
                <Select value={selectedProject} onValueChange={v => { setSelectedProject(v); setSelectedTask(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select project..." /></SelectTrigger>
                  <SelectContent>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={selectedTask} onValueChange={setSelectedTask}>
                  <SelectTrigger><SelectValue placeholder="Select task..." /></SelectTrigger>
                  <SelectContent>
                    {filteredTasks.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes..." className="sm:col-span-2" />
                <div className="flex items-center gap-2">
                  <Input value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} placeholder="$/hr" type="number" className="w-20" />
                  <label className="flex items-center gap-1.5 text-sm text-slate-600 whitespace-nowrap">
                    <input type="checkbox" checked={isBillable} onChange={e => setIsBillable(e.target.checked)} />
                    Billable
                  </label>
                </div>
              </div>
            </div>

            {/* Timer Display */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className={`font-mono text-3xl font-bold tabular-nums ${running ? 'text-indigo-600' : 'text-slate-700'}`}>
                {formatSeconds(elapsed)}
              </div>
              <Button
                onClick={running ? stopTimer : startTimer}
                className={`w-12 h-12 rounded-full p-0 ${running ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
              >
                {running ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border p-4 text-center">
            <p className="text-xs text-slate-500">Total Tracked</p>
            <p className="text-xl font-bold text-slate-900 font-mono">{formatSeconds(totalTracked)}</p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <p className="text-xs text-slate-500">Entries</p>
            <p className="text-xl font-bold text-slate-900">{entries.filter(e => e.duration_seconds).length}</p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <p className="text-xs text-slate-500">Billable Value</p>
            <p className="text-xl font-bold text-green-600">${totalBillable.toFixed(0)}</p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <p className="text-xs text-slate-500">Projects</p>
            <p className="text-xl font-bold text-indigo-600">{projectTotals.length}</p>
          </div>
        </div>

        {/* Project Billing & Invoicing */}
        <ProjectInvoicePanel projects={projects} entries={entries} />

        {/* Project Breakdown */}
        {projectTotals.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-semibold text-slate-800 mb-4">By Project</h2>
            <div className="space-y-3">
              {projectTotals.map(p => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color || '#6366f1' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-800 truncate">{p.name}</span>
                      <span className="text-xs text-slate-500 ml-2 flex-shrink-0">{formatSeconds(p.totalSecs)}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min((p.totalSecs / totalTracked) * 100, 100)}%` }} />
                    </div>
                  </div>
                  {p.billableAmount > 0 && (
                    <span className="text-sm font-medium text-green-600 flex-shrink-0">${p.billableAmount.toFixed(0)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timesheet */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Timesheet History</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {entries.filter(e => e.duration_seconds).length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No time entries yet. Start a timer above.</p>
              </div>
            ) : (
              entries.filter(e => e.duration_seconds).map(entry => (
                <div key={entry.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{entry.task_title || "Manual entry"}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {entry.project_name && <span className="text-xs text-slate-500">{entry.project_name}</span>}
                      {entry.notes && <span className="text-xs text-slate-400 truncate">— {entry.notes}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-slate-400">{entry.start_time ? format(parseISO(entry.start_time), 'MMM d') : ''}</span>
                    <span className="font-mono text-sm font-medium text-slate-700">{formatSeconds(entry.duration_seconds)}</span>
                    {entry.is_billable && entry.hourly_rate > 0 && (
                      <span className="text-xs text-green-600 font-medium">${((entry.duration_seconds / 3600) * entry.hourly_rate).toFixed(2)}</span>
                    )}
                    {entry.is_billable ? (
                      <Badge className="text-xs bg-green-50 text-green-700 border-0">Billable</Badge>
                    ) : (
                      <Badge className="text-xs bg-slate-100 text-slate-500 border-0">Non-billable</Badge>
                    )}
                    <button onClick={() => deleteMutation.mutate(entry.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}