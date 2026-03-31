import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval, parseISO } from "date-fns";
import { BarChart3, Users, Clock, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f97316", "#22c55e", "#14b8a6", "#0ea5e9", "#eab308"];

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [range, setRange] = useState("30");
  const days = parseInt(range);

  const { data: projects = [] } = useQuery({
    queryKey: ["analytics-projects"],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["analytics-tasks"],
    queryFn: () => base44.entities.Task.list(),
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ["analytics-time"],
    queryFn: () => base44.entities.TimeEntry.list(),
  });

  // ── Task Completion Over Time ──────────────────────────────────────────────
  const completionData = useMemo(() => {
    const start = startOfDay(subDays(new Date(), days - 1));
    const dateRange = eachDayOfInterval({ start, end: new Date() });

    return dateRange.map(date => {
      const dateStr = format(date, "yyyy-MM-dd");
      const completed = tasks.filter(t =>
        t.completed_at && format(parseISO(t.completed_at), "yyyy-MM-dd") === dateStr
      ).length;
      const created = tasks.filter(t =>
        format(parseISO(t.created_date), "yyyy-MM-dd") === dateStr
      ).length;
      return { date: format(date, "MMM d"), completed, created };
    });
  }, [tasks, days]);

  // ── Workload Distribution ──────────────────────────────────────────────────
  const workloadData = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      const key = t.assigned_to || "Unassigned";
      if (!map[key]) map[key] = { name: key.split("@")[0], todo: 0, in_progress: 0, completed: 0 };
      if (t.status === "completed") map[key].completed++;
      else if (t.status === "in_progress") map[key].in_progress++;
      else map[key].todo++;
    });
    return Object.values(map).sort((a, b) => (b.todo + b.in_progress + b.completed) - (a.todo + a.in_progress + a.completed)).slice(0, 8);
  }, [tasks]);

  // ── Billable vs Non-Billable Hours ────────────────────────────────────────
  const billableData = useMemo(() => {
    const billable = timeEntries.filter(e => e.is_billable).reduce((s, e) => s + (e.duration_seconds || 0), 0);
    const nonBillable = timeEntries.filter(e => !e.is_billable).reduce((s, e) => s + (e.duration_seconds || 0), 0);
    const toHours = s => parseFloat((s / 3600).toFixed(1));
    return [
      { name: "Billable", value: toHours(billable) },
      { name: "Non-Billable", value: toHours(nonBillable) },
    ];
  }, [timeEntries]);

  // ── Billable by Project ────────────────────────────────────────────────────
  const billableByProject = useMemo(() => {
    const map = {};
    timeEntries.forEach(e => {
      const key = e.project_name || "Unknown";
      if (!map[key]) map[key] = { name: key, billable: 0, nonBillable: 0 };
      const hrs = (e.duration_seconds || 0) / 3600;
      if (e.is_billable) map[key].billable += hrs;
      else map[key].nonBillable += hrs;
    });
    return Object.values(map).map(d => ({
      ...d,
      billable: parseFloat(d.billable.toFixed(1)),
      nonBillable: parseFloat(d.nonBillable.toFixed(1)),
    })).sort((a, b) => (b.billable + b.nonBillable) - (a.billable + a.nonBillable)).slice(0, 7);
  }, [timeEntries]);

  const totalCompleted = tasks.filter(t => t.status === "completed").length;
  const completionRate = tasks.length > 0 ? Math.round((totalCompleted / tasks.length) * 100) : 0;
  const totalBillableHrs = parseFloat((timeEntries.filter(e => e.is_billable).reduce((s, e) => s + (e.duration_seconds || 0), 0) / 3600).toFixed(1));
  const activeMembers = new Set(tasks.map(t => t.assigned_to).filter(Boolean)).size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Project Analytics</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Visualize task progress, workload, and time tracking</p>
          </div>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={BarChart3} label="Completion Rate" value={`${completionRate}%`} sub={`${totalCompleted} of ${tasks.length} tasks`} color="bg-indigo-500" />
          <StatCard icon={TrendingUp} label="Total Tasks" value={tasks.length} sub={`${projects.length} projects`} color="bg-purple-500" />
          <StatCard icon={Users} label="Active Members" value={activeMembers} sub="with assigned tasks" color="bg-pink-500" />
          <StatCard icon={Clock} label="Billable Hours" value={`${totalBillableHrs}h`} sub="tracked & billable" color="bg-amber-500" />
        </div>

        {/* Task Completion Over Time */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Task Completion Over Time</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">Tasks created vs completed per day</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={completionData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval={Math.floor(completionData.length / 6)} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="created" name="Created" stroke="#6366f1" fill="url(#gradCreated)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="completed" name="Completed" stroke="#22c55e" fill="url(#gradCompleted)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Workload Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Workload Distribution</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">Task status breakdown per team member</p>
          {workloadData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No assigned tasks yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={workloadData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="todo" name="To Do" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="in_progress" name="In Progress" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Billable vs Non-Billable */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pie */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Billable vs Non-Billable Hours</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">Overall time breakdown</p>
            {billableData.every(d => d.value === 0) ? (
              <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No time entries yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={billableData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}h`} labelLine={false}>
                    <Cell fill="#6366f1" />
                    <Cell fill="#e2e8f0" />
                  </Pie>
                  <Tooltip formatter={(v) => `${v}h`} contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* By Project */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Hours by Project</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">Billable & non-billable per project</p>
            {billableByProject.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No time entries yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={billableByProject} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} unit="h" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={80} />
                  <Tooltip formatter={(v) => `${v}h`} contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="billable" name="Billable" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="nonBillable" name="Non-Billable" fill="#e2e8f0" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}