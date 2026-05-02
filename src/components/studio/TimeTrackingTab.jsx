import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Clock, TrendingUp, Zap, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card } from "@/components/ui/card";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];

export default function TimeTrackingTab() {
  const [user, setUser] = useState(null);
  const [timeRange, setTimeRange] = useState("week");

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: timeEntries = [] } = useQuery({
    queryKey: ["time-entries", user?.email],
    queryFn: () => base44.entities.TimeEntry?.filter?.({ user_email: user?.email }, "-start_time") || [],
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.list(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list(),
    staleTime: 10 * 60 * 1000,
  });

  const days = timeRange === "week" ? 7 : timeRange === "month" ? 30 : 1;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const filteredEntries = useMemo(() =>
    timeEntries.filter(e => new Date(e.start_time || e.date) >= cutoff),
    [timeEntries, days]
  );

  const totalHours = useMemo(() =>
    filteredEntries.reduce((sum, t) => sum + (t.duration_minutes ? t.duration_minutes / 60 : 0), 0),
    [filteredEntries]
  );

  const projectTimeData = useMemo(() => {
    const grouped = {};
    filteredEntries.forEach((e) => {
      const task = tasks.find((t) => t.id === e.task_id);
      const proj = projects.find((p) => p.id === task?.project_id);
      const projName = proj?.name || "Unassigned";
      grouped[projName] = (grouped[projName] || 0) + (e.duration_minutes ? e.duration_minutes / 60 : 0);
    });
    return Object.entries(grouped)
      .map(([name, hours]) => ({ name, hours: parseFloat(hours.toFixed(2)) }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);
  }, [filteredEntries, tasks, projects]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Time Tracking</h2>
          <p className="text-sm text-muted-foreground mt-1">Track and analyze your time</p>
        </div>
        <div className="flex gap-1">
          {["week", "month"].map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeRange === r
                  ? "bg-[#1e78ff] text-white"
                  : "bg-[#0a1525] text-blue-400/50 hover:text-blue-300 border border-blue-900/40"
              }`}
            >
              {r === "week" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#060d18] border border-blue-900/40 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-[#1e78ff]" />
            <p className="text-xs text-blue-400/60">Total Hours</p>
          </div>
          <p className="text-3xl font-black text-[#e8f4ff]">{totalHours.toFixed(1)}h</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#060d18] border border-blue-900/40 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-[#a855f7]" />
            <p className="text-xs text-blue-400/60">Entries</p>
          </div>
          <p className="text-3xl font-black text-[#e8f4ff]">{filteredEntries.length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#060d18] border border-blue-900/40 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-[#22c55e]" />
            <p className="text-xs text-blue-400/60">Avg/Day</p>
          </div>
          <p className="text-3xl font-black text-[#e8f4ff]">{(totalHours / Math.max(days, 1)).toFixed(1)}h</p>
        </motion.div>
      </div>

      {/* Charts */}
      {projectTimeData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 bg-[#060d18] border-blue-900/40">
            <p className="text-sm font-bold text-[#e8f4ff] mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#1e78ff]" /> Top Projects
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={projectTimeData} barSize={16} margin={{ top: 0, right: 8, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#3a6080" }} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10, fill: "#3a6080" }} />
                <Tooltip contentStyle={{ backgroundColor: "#060d18", border: "1px solid #0d2040" }} />
                <Bar dataKey="hours" name="Hours" fill="#1e78ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-4 bg-[#060d18] border-blue-900/40">
            <p className="text-sm font-bold text-[#e8f4ff] mb-4">Distribution</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={projectTimeData}
                  dataKey="hours"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  label={false}
                >
                  {projectTimeData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#060d18", border: "1px solid #0d2040" }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      ) : (
        <div className="p-8 text-center border border-dashed border-blue-900/40 rounded-lg">
          <Clock className="w-8 h-8 text-blue-400/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No time entries logged</p>
        </div>
      )}
    </div>
  );
}