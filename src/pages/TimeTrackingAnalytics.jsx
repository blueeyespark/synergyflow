import { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, subDays, startOfDay } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Clock, Users, FolderKanban, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export default function TimeTrackingAnalytics() {
  const [user, setUser] = useState(null);
  const [dateRange, setDateRange] = useState("week");

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: timeEntries = [] } = useQuery({
    queryKey: ["time_entries"],
    queryFn: () => base44.entities.TimeEntry.list("-start_time"),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.list(),
  });

  const filteredEntries = useMemo(() => {
    const days = dateRange === "week" ? 7 : dateRange === "month" ? 30 : 1;
    const cutoff = subDays(new Date(), days);
    
    return timeEntries.filter(e => new Date(e.start_time) >= cutoff);
  }, [timeEntries, dateRange]);

  // Total hours by project
  const projectHours = useMemo(() => {
    const grouped = {};
    
    filteredEntries.forEach(entry => {
      const task = tasks.find(t => t.id === entry.task_id);
      const project = projects.find(p => p.id === task?.project_id);
      const projectName = project?.name || "Unassigned";
      
      if (!grouped[projectName]) {
        grouped[projectName] = 0;
      }
      grouped[projectName] += entry.duration_seconds / 3600;
    });

    return Object.entries(grouped).map(([name, hours]) => ({
      name,
      hours: parseFloat(hours.toFixed(2)),
    })).sort((a, b) => b.hours - a.hours);
  }, [filteredEntries, tasks, projects]);

  // Total hours by team member
  const memberHours = useMemo(() => {
    const grouped = {};
    
    filteredEntries.forEach(entry => {
      const member = entry.user_email.split("@")[0];
      
      if (!grouped[member]) {
        grouped[member] = 0;
      }
      grouped[member] += entry.duration_seconds / 3600;
    });

    return Object.entries(grouped)
      .map(([name, hours]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        hours: parseFloat(hours.toFixed(2)),
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [filteredEntries]);

  // Daily hours
  const dailyHours = useMemo(() => {
    const grouped = {};
    const days = dateRange === "week" ? 7 : dateRange === "month" ? 30 : 1;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const dateStr = format(date, "MMM dd");
      grouped[dateStr] = 0;
    }

    filteredEntries.forEach(entry => {
      const date = startOfDay(new Date(entry.start_time));
      const dateStr = format(date, "MMM dd");
      if (grouped[dateStr] !== undefined) {
        grouped[dateStr] += entry.duration_seconds / 3600;
      }
    });

    return Object.entries(grouped).map(([date, hours]) => ({
      date,
      hours: parseFloat(hours.toFixed(2)),
    }));
  }, [filteredEntries, dateRange]);

  const totalHours = filteredEntries.reduce((sum, e) => sum + (e.duration_seconds / 3600), 0);
  const totalEntries = filteredEntries.length;
  const avgHoursPerEntry = totalEntries > 0 ? (totalHours / totalEntries).toFixed(2) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-slate-900">Time Tracking Analytics</h1>
          <p className="text-slate-500 mt-1">Track team productivity and project hours</p>
        </motion.div>

        {/* Date range selector */}
        <div className="flex gap-2">
          {["day", "week", "month"].map(range => (
            <Button
              key={range}
              variant={dateRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange(range)}
              className="capitalize"
            >
              {range}
            </Button>
          ))}
        </div>

        {/* Stats cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Total Hours</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{totalHours.toFixed(1)}</p>
              </div>
              <Clock className="w-8 h-8 text-indigo-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Time Entries</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{totalEntries}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Avg/Entry</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{avgHoursPerEntry}h</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Projects</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{projectHours.length}</p>
              </div>
              <FolderKanban className="w-8 h-8 text-amber-500" />
            </div>
          </div>
        </motion.div>

        {/* Charts */}
        <Tabs defaultValue="project" className="space-y-4">
          <TabsList>
            <TabsTrigger value="project">By Project</TabsTrigger>
            <TabsTrigger value="member">By Team Member</TabsTrigger>
            <TabsTrigger value="daily">Daily Trend</TabsTrigger>
          </TabsList>

          <TabsContent value="project" className="bg-white rounded-xl border border-slate-100 p-6">
            {projectHours.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value}h`} />
                  <Bar dataKey="hours" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-slate-500 py-12">No time entries yet</p>
            )}
          </TabsContent>

          <TabsContent value="member" className="bg-white rounded-xl border border-slate-100 p-6">
            {memberHours.length > 0 ? (
              <div className="flex gap-8">
                <ResponsiveContainer width="50%" height={300}>
                  <PieChart>
                    <Pie data={memberHours} dataKey="hours" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                      {memberHours.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}h`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  {memberHours.map((member, idx) => (
                    <div key={member.name} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-slate-700">{member.name}</span>
                      <span className="text-sm text-slate-500 ml-auto">{member.hours}h</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-slate-500 py-12">No time entries yet</p>
            )}
          </TabsContent>

          <TabsContent value="daily" className="bg-white rounded-xl border border-slate-100 p-6">
            {dailyHours.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value}h`} />
                  <Bar dataKey="hours" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-slate-500 py-12">No time entries yet</p>
            )}
          </TabsContent>
        </Tabs>

        {/* Top tasks */}
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 mb-4">Top Tasks by Hours</h3>
          <div className="space-y-3">
            {filteredEntries
              .reduce((acc, entry) => {
                const existing = acc.find(e => e.task_id === entry.task_id);
                if (existing) {
                  existing.hours += entry.duration_seconds / 3600;
                } else {
                  acc.push({ task_id: entry.task_id, hours: entry.duration_seconds / 3600, title: entry.task_title });
                }
                return acc;
              }, [])
              .sort((a, b) => b.hours - a.hours)
              .slice(0, 5)
              .map((task, idx) => (
                <div key={task.task_id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs font-bold text-slate-400 w-6">{idx + 1}</span>
                  <span className="text-sm font-medium text-slate-700 flex-1">{task.title}</span>
                  <span className="text-sm font-bold text-indigo-600">{task.hours.toFixed(1)}h</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}