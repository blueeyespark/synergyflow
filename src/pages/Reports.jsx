import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isWithinInterval } from "date-fns";
import {
  Download, Filter, BarChart3, PieChart, TrendingUp, Users,
  CheckCircle2, Clock, DollarSign, FolderKanban, Calendar as CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, LineChart, Line, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from "recharts";

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#0ea5e9'];

export default function ReportsPage() {
  const [user, setUser] = useState(null);
  const [dateRange, setDateRange] = useState({ from: subMonths(new Date(), 1), to: new Date() });
  const [selectedProject, setSelectedProject] = useState("all");

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
  });

  const { data: budget = [] } = useQuery({
    queryKey: ['budget'],
    queryFn: () => base44.entities.Budget.list(),
  });

  // Filter data by date range and project
  const filteredTasks = tasks.filter(t => {
    const inDateRange = t.created_date && isWithinInterval(parseISO(t.created_date), { start: dateRange.from, end: dateRange.to });
    const inProject = selectedProject === "all" || t.project_id === selectedProject;
    return inDateRange && inProject;
  });

  const filteredBudget = budget.filter(b => {
    const inDateRange = b.date && isWithinInterval(parseISO(b.date), { start: dateRange.from, end: dateRange.to });
    const inProject = selectedProject === "all" || b.project_id === selectedProject;
    return inDateRange && inProject;
  });

  // Calculate metrics
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const totalIncome = filteredBudget.filter(b => b.type === 'income').reduce((sum, b) => sum + b.amount, 0);
  const totalExpenses = filteredBudget.filter(b => b.type === 'expense').reduce((sum, b) => sum + b.amount, 0);

  // Tasks by status
  const tasksByStatus = ['todo', 'in_progress', 'review', 'completed'].map(status => ({
    name: status.replace('_', ' '),
    value: filteredTasks.filter(t => t.status === status).length
  }));

  // Tasks by priority
  const tasksByPriority = ['low', 'medium', 'high', 'urgent'].map(priority => ({
    name: priority,
    value: filteredTasks.filter(t => t.priority === priority).length
  }));

  // Daily task completion trend
  const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
  const dailyCompletion = days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const completed = filteredTasks.filter(t => 
      t.completed_at && format(parseISO(t.completed_at), 'yyyy-MM-dd') === dayStr
    ).length;
    const created = filteredTasks.filter(t => 
      t.created_date && format(parseISO(t.created_date), 'yyyy-MM-dd') === dayStr
    ).length;
    return { date: format(day, 'MMM d'), completed, created };
  });

  // Team performance
  const teamMembers = [...new Set(filteredTasks.map(t => t.assigned_to).filter(Boolean))];
  const teamPerformance = teamMembers.map(email => {
    const memberTasks = filteredTasks.filter(t => t.assigned_to === email);
    const completed = memberTasks.filter(t => t.status === 'completed').length;
    return {
      name: email.split('@')[0],
      total: memberTasks.length,
      completed,
      rate: memberTasks.length > 0 ? Math.round((completed / memberTasks.length) * 100) : 0
    };
  }).sort((a, b) => b.completed - a.completed);

  // Budget by category
  const categories = [...new Set(filteredBudget.map(b => b.category).filter(Boolean))];
  const budgetByCategory = categories.map(cat => ({
    name: cat,
    income: filteredBudget.filter(b => b.category === cat && b.type === 'income').reduce((sum, b) => sum + b.amount, 0),
    expense: filteredBudget.filter(b => b.category === cat && b.type === 'expense').reduce((sum, b) => sum + b.amount, 0)
  }));

  const exportReport = () => {
    const data = {
      dateRange: { from: format(dateRange.from, 'yyyy-MM-dd'), to: format(dateRange.to, 'yyyy-MM-dd') },
      summary: { totalTasks, completedTasks, completionRate, totalIncome, totalExpenses },
      tasksByStatus,
      tasksByPriority,
      teamPerformance,
      budgetByCategory
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Reports & Analytics
            </h1>
            <p className="text-slate-500 mt-1">Track progress and performance</p>
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => range && setDateRange(range)}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={exportReport} className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-100">
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Completion Rate</p>
                <p className="text-2xl font-bold text-slate-900">{completionRate}%</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-100">
                <FolderKanban className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Tasks</p>
                <p className="text-2xl font-bold text-slate-900">{totalTasks}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-100">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Income</p>
                <p className="text-2xl font-bold text-green-600">${totalIncome.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-100">
                <DollarSign className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">${totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="tasks">Task Analytics</TabsTrigger>
            <TabsTrigger value="team">Team Performance</TabsTrigger>
            <TabsTrigger value="budget">Budget Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-6">
            {/* Task Completion Trend */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold mb-4">Task Activity Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyCompletion}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="created" stackId="1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} name="Created" />
                  <Area type="monotone" dataKey="completed" stackId="2" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} name="Completed" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Tasks by Status */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-semibold mb-4">Tasks by Status</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <RePieChart>
                    <Pie data={tasksByStatus} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {tasksByStatus.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>

              {/* Tasks by Priority */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-semibold mb-4">Tasks by Priority</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={tasksByPriority}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold mb-4">Team Performance</h3>
              {teamPerformance.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No team data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={teamPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#64748b" />
                    <YAxis dataKey="name" type="category" stroke="#64748b" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" fill="#22c55e" name="Completed" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="total" fill="#e2e8f0" name="Total" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Performance Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              {teamPerformance.slice(0, 3).map((member, index) => (
                <div key={member.name} className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : 'bg-amber-700'}`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-sm text-slate-500">{member.completed} / {member.total} tasks</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${member.rate}%` }} />
                  </div>
                  <p className="text-right text-sm text-slate-500 mt-1">{member.rate}%</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="budget" className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold mb-4">Budget by Category</h3>
              {budgetByCategory.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No budget data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={budgetByCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="income" fill="#22c55e" name="Income" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}