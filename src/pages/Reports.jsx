import { useState, useEffect, useRef, useMemo } from "react";
import BudgetPage from "./Budget";
import TimeTracking from "./TimeTracking";
import Invoicing from "./Invoicing";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, subDays, subMonths, eachDayOfInterval, parseISO, isWithinInterval } from "date-fns";
import {
  Download, BarChart3, TrendingUp, Users,
  CheckCircle2, Clock, DollarSign, FolderKanban, Calendar as CalendarIcon,
  FileText, FileSpreadsheet, Loader2
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart, Bar, LineChart, Line, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from "recharts";
import { toast } from "sonner";

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#0ea5e9'];

export default function ReportsPage() {
  const [user, setUser] = useState(null);
  const [dateRange, setDateRange] = useState({ from: subMonths(new Date(), 1), to: new Date() });
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: planners = [] } = useQuery({
    queryKey: ['planners'],
    queryFn: () => base44.entities.Planner.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
  });

  const { data: budget = [] } = useQuery({
    queryKey: ['budget'],
    queryFn: () => base44.entities.Budget.list(),
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ['time-entries'],
    queryFn: () => base44.entities.TimeEntry.list(),
  });

  const [analyticsRange, setAnalyticsRange] = useState("30");

  const billableData = useMemo(() => {
    const billable = timeEntries.filter(e => e.is_billable).reduce((s, e) => s + (e.duration_seconds || 0), 0);
    const nonBillable = timeEntries.filter(e => !e.is_billable).reduce((s, e) => s + (e.duration_seconds || 0), 0);
    const toHours = s => parseFloat((s / 3600).toFixed(1));
    return [{ name: "Billable", value: toHours(billable) }, { name: "Non-Billable", value: toHours(nonBillable) }];
  }, [timeEntries]);

  const billableByProject = useMemo(() => {
    const map = {};
    timeEntries.forEach(e => {
      const key = e.project_name || "Unknown";
      if (!map[key]) map[key] = { name: key, billable: 0, nonBillable: 0 };
      const hrs = (e.duration_seconds || 0) / 3600;
      if (e.is_billable) map[key].billable += hrs; else map[key].nonBillable += hrs;
    });
    return Object.values(map).map(d => ({ ...d, billable: parseFloat(d.billable.toFixed(1)), nonBillable: parseFloat(d.nonBillable.toFixed(1)) }))
      .sort((a, b) => (b.billable + b.nonBillable) - (a.billable + a.nonBillable)).slice(0, 7);
  }, [timeEntries]);

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

  const totalBillableHrs = parseFloat((timeEntries.filter(e => e.is_billable).reduce((s, e) => s + (e.duration_seconds || 0), 0) / 3600).toFixed(1));

  // Get all unique users
  const allUsers = [...new Set([
    ...tasks.map(t => t.assigned_to).filter(Boolean),
    ...tasks.map(t => t.created_by).filter(Boolean)
  ])];

  // Filter data
  const filteredTasks = tasks.filter(t => {
    const inDateRange = t.created_date && isWithinInterval(parseISO(t.created_date), { start: dateRange.from, end: dateRange.to });
    const inProject = selectedProject === "all" || t.project_id === selectedProject;
    const byUser = selectedUser === "all" || t.assigned_to === selectedUser || t.created_by === selectedUser;
    return inDateRange && inProject && byUser;
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
  const teamPerformance = allUsers.map(email => {
    const memberTasks = filteredTasks.filter(t => t.assigned_to === email);
    const completed = memberTasks.filter(t => t.status === 'completed').length;
    return {
      name: email.split('@')[0],
      email,
      total: memberTasks.length,
      completed,
      rate: memberTasks.length > 0 ? Math.round((completed / memberTasks.length) * 100) : 0
    };
  }).filter(m => m.total > 0).sort((a, b) => b.completed - a.completed);

  // Budget by category
  const categories = [...new Set(filteredBudget.map(b => b.category).filter(Boolean))];
  const budgetByCategory = categories.map(cat => ({
    name: cat,
    income: filteredBudget.filter(b => b.category === cat && b.type === 'income').reduce((sum, b) => sum + b.amount, 0),
    expense: filteredBudget.filter(b => b.category === cat && b.type === 'expense').reduce((sum, b) => sum + b.amount, 0)
  }));

  // Export to CSV
  const exportCSV = () => {
    setExporting(true);
    
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Date Range', `${format(dateRange.from, 'yyyy-MM-dd')} to ${format(dateRange.to, 'yyyy-MM-dd')}`],
      ['Total Tasks', totalTasks],
      ['Completed Tasks', completedTasks],
      ['Completion Rate', `${completionRate}%`],
      ['Total Income', `$${totalIncome}`],
      ['Total Expenses', `$${totalExpenses}`],
      ['Net', `$${totalIncome - totalExpenses}`],
      [''],
      ['Team Performance'],
      ['Name', 'Total Tasks', 'Completed', 'Rate'],
      ...teamPerformance.map(m => [m.name, m.total, m.completed, `${m.rate}%`]),
      [''],
      ['Tasks by Status'],
      ...tasksByStatus.map(s => [s.name, s.value]),
      [''],
      ['Budget by Category'],
      ['Category', 'Income', 'Expense'],
      ...budgetByCategory.map(c => [c.name, c.income, c.expense])
    ];

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    
    setExporting(false);
    toast.success("CSV exported");
  };

  // Export to PDF (using html2canvas + jspdf)
  const exportPDF = async () => {
    setExporting(true);
    toast.info("Generating PDF...");
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      const element = reportRef.current;
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast.success("PDF exported");
    } catch (error) {
      toast.error("Failed to export PDF");
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" ref={reportRef}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Reports & Analytics
            </h1>
            <p className="text-slate-500 mt-1">Track progress, performance, and spending</p>
          </div>
          <div className="flex flex-wrap gap-2">
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
                {planners.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name} (Planner)</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {allUsers.map(email => (
                  <SelectItem key={email} value={email}>{email.split('@')[0]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2" disabled={exporting}>
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={exportCSV}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportPDF}>
                  <FileText className="w-4 h-4 mr-2" /> Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
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
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-100">
                <FolderKanban className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Tasks</p>
                <p className="text-2xl font-bold text-slate-900">{totalTasks}</p>
                <p className="text-xs text-green-600">{completedTasks} completed</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
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
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
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

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-white border shadow-sm flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
            <TabsTrigger value="budgetmgr">💰 Budget</TabsTrigger>
            <TabsTrigger value="timetracker">⏱ Time Tracker</TabsTrigger>
            <TabsTrigger value="invoicing">🧾 Invoicing</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Task Analytics */}
            <div>
              <h2 className="text-xl font-bold mb-4 text-slate-900">Task Analytics</h2>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
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

              <div className="grid lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="font-semibold mb-4">Tasks by Status</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <RePieChart>
                      <Pie data={tasksByStatus} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}>
                        {tasksByStatus.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="font-semibold mb-4">Tasks by Priority</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={tasksByPriority}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {tasksByPriority.map((_, index) => (
                          <Cell key={index} fill={['#3b82f6', '#f59e0b', '#f97316', '#ef4444'][index]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Team Performance */}
            <div>
              <h2 className="text-xl font-bold mb-4 text-slate-900">Team Performance</h2>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
                <h3 className="font-semibold mb-4">Team Performance</h3>
                {teamPerformance.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No team data available for selected filters</p>
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

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {teamPerformance.slice(0, 6).map((member, index) => (
                  <div key={member.email} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 
                        index === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-600' : 
                        index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                        'bg-gradient-to-br from-indigo-400 to-indigo-600'
                      }`}>
                        {index < 3 ? index + 1 : member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-sm text-slate-500">{member.completed} / {member.total} tasks</p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all" style={{ width: `${member.rate}%` }} />
                    </div>
                    <p className="text-right text-sm text-slate-500 mt-1">{member.rate}% completion</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget Analysis */}
            <div>
              <h2 className="text-xl font-bold mb-4 text-slate-900">Budget Analysis</h2>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
                <h3 className="font-semibold mb-4">Budget by Category</h3>
                {budgetByCategory.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No budget data available for selected filters</p>
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

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
                <h3 className="font-semibold mb-4">Budget Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-sm text-green-600 mb-1">Total Income</p>
                    <p className="text-2xl font-bold text-green-700">${totalIncome.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-xl">
                    <p className="text-sm text-red-600 mb-1">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-700">${totalExpenses.toLocaleString()}</p>
                  </div>
                  <div className={`p-4 rounded-xl ${totalIncome - totalExpenses >= 0 ? 'bg-indigo-50' : 'bg-amber-50'}`}>
                    <p className={`text-sm mb-1 ${totalIncome - totalExpenses >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>Net</p>
                    <p className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-indigo-700' : 'text-amber-700'}`}>
                      ${(totalIncome - totalExpenses).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Time & Workload */}
            <div>
              <h2 className="text-xl font-bold mb-4 text-slate-900">Time & Workload</h2>
              <div className="grid lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="font-semibold mb-1">Billable vs Non-Billable Hours</h3>
                  <p className="text-xs text-slate-400 mb-4">Total: {totalBillableHrs}h billable</p>
                  {billableData.every(d => d.value === 0) ? (
                    <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No time entries yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <RePieChart>
                        <Pie data={billableData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}h`} labelLine={false}>
                          <Cell fill="#6366f1" />
                          <Cell fill="#e2e8f0" />
                        </Pie>
                        <Tooltip formatter={(v) => `${v}h`} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </RePieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="font-semibold mb-1">Hours by Project</h3>
                  <p className="text-xs text-slate-400 mb-4">Billable & non-billable per project</p>
                  {billableByProject.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No time entries yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={billableByProject} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }} barSize={12}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} unit="h" />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={80} />
                        <Tooltip formatter={(v) => `${v}h`} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="billable" name="Billable" fill="#6366f1" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="nonBillable" name="Non-Billable" fill="#e2e8f0" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Workload Distribution by Member</h3>
                {workloadData.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No assigned tasks yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={workloadData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barSize={18}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="todo" name="To Do" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="in_progress" name="In Progress" fill="#f97316" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="completed" name="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </TabsContent>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
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
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Tasks by Status</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <RePieChart>
                    <Pie data={tasksByStatus} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}>
                      {tasksByStatus.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Tasks by Priority</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={tasksByPriority}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {tasksByPriority.map((_, index) => (
                        <Cell key={index} fill={['#3b82f6', '#f59e0b', '#f97316', '#ef4444'][index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="budgetmgr" className="-mx-4 sm:-mx-6 lg:-mx-8">
            <BudgetPage />
          </TabsContent>
          <TabsContent value="timetracker" className="-mx-4 sm:-mx-6 lg:-mx-8">
            <TimeTracking />
          </TabsContent>
          <TabsContent value="invoicing" className="-mx-4 sm:-mx-6 lg:-mx-8">
            <Invoicing />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}