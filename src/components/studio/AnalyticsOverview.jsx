import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, DollarSign, BarChart3, Clock } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import ProjectHealthMonitor from "@/components/ai/ProjectHealthMonitor";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4"];

export default function AnalyticsOverview() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", user?.email],
    queryFn: () => base44.entities.Project.list("-created_date"),
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", user?.email],
    queryFn: () => base44.entities.Task.list("-created_date"),
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000,
  });

  const { data: budget = [] } = useQuery({
    queryKey: ["budget", user?.email],
    queryFn: () => base44.entities.Budget.list("-date"),
    enabled: !!user?.email,
    staleTime: 15 * 60 * 1000,
  });

  const myProjects = projects.filter(
    (p) => p.owner_email === user?.email || p.team_members?.includes(user?.email)
  );
  const myTasks = tasks.filter((t) => {
    const project = myProjects.find((p) => p.id === t.project_id);
    return project;
  });

  const totalIncome = budget.filter(b => b.type === "income").reduce((s, b) => s + b.amount, 0);
  const totalExpense = budget.filter(b => b.type === "expense").reduce((s, b) => s + b.amount, 0);
  const netBudget = totalIncome - totalExpense;

  // Task completion by status for pie chart
  const statusCounts = myTasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // Weekly task creation trend
  const generateTrendData = () => {
    const weeks = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i * 7);
      const weekEnd = new Date(date.getTime() + 6 * 24 * 60 * 60 * 1000);
      const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const total = myTasks.filter(t => {
        const d = new Date(t.created_date);
        return d >= date && d <= weekEnd;
      }).length;
      const completed = myTasks.filter(t => {
        const d = new Date(t.created_date);
        return d >= date && d <= weekEnd && t.status === "completed";
      }).length;
      weeks.push({ week: label, total, completed });
    }
    return weeks;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Income", value: `$${totalIncome.toLocaleString()}`, icon: DollarSign, color: "text-green-600 bg-green-50" },
          { label: "Total Expenses", value: `$${totalExpense.toLocaleString()}`, icon: DollarSign, color: "text-red-500 bg-red-50" },
          { label: "Net Budget", value: `$${netBudget.toLocaleString()}`, icon: TrendingUp, color: netBudget >= 0 ? "text-indigo-600 bg-indigo-50" : "text-red-500 bg-red-50" },
          { label: "Active Projects", value: myProjects.filter(p => p.status !== "completed").length, icon: BarChart3, color: "text-cyan-600 bg-cyan-50" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Completion Trend */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Task Completion Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={generateTrendData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Task Status Breakdown */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Task Status Breakdown</h3>
          {statusData.length > 0 ? (
            <div className="flex gap-4 items-center">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" cx="50%" cy="50%" outerRadius={70}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {statusData.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-2 text-sm">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-slate-600 capitalize">{s.name}</span>
                    <span className="font-semibold text-slate-800 ml-auto">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-sm text-center py-8">No task data yet</p>
          )}
        </div>
      </div>

      {/* Project Health */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-4">Project Health Monitor</h3>
        <ProjectHealthMonitor projects={myProjects} tasks={myTasks} />
      </div>
    </div>
  );
}