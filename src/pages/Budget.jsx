import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, subMonths } from "date-fns";
import { 
  Plus, TrendingUp, TrendingDown, DollarSign, 
  Calculator, PieChart, BarChart3, LineChart, Activity, CircleDot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart as ReLineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ComposedChart
} from "recharts";
import { toast } from "sonner";

import BudgetCalculator from "@/components/budget/BudgetCalculator";
import ProjectInvoicePanel from "@/components/billing/ProjectInvoicePanel";

const categories = ["Salary", "Freelance", "Marketing", "Software", "Equipment", "Travel", "Office", "Other"];
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#0ea5e9'];

export default function BudgetPage() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [chartType, setChartType] = useState("bar");
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    type: "expense",
    category: "",
    date: new Date().toISOString().split('T')[0],
    notes: ""
  });
  
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ['time-entries-budget'],
    queryFn: () => base44.entities.TimeEntry.list('-created_date', 500),
  });

  const { data: budgetEntries = [] } = useQuery({
    queryKey: ['budget'],
    queryFn: () => base44.entities.Budget.list('-date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Budget.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      setShowForm(false);
      setFormData({ title: "", amount: "", type: "expense", category: "", date: new Date().toISOString().split('T')[0], notes: "" });
      toast.success("Entry added");
    },
  });

  // Calculate totals
  const totalIncome = budgetEntries.filter(e => e.type === "income").reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = budgetEntries.filter(e => e.type === "expense").reduce((sum, e) => sum + e.amount, 0);
  const netWorth = totalIncome - totalExpenses;

  // Calculate yearly income
  const currentYear = new Date().getFullYear();
  const yearlyIncome = budgetEntries
    .filter(e => e.type === "income" && new Date(e.date).getFullYear() === currentYear)
    .reduce((sum, e) => sum + e.amount, 0);

  // Monthly data for charts
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    const monthEntries = budgetEntries.filter(e => {
      const entryDate = parseISO(e.date);
      return entryDate >= monthStart && entryDate <= monthEnd;
    });

    const income = monthEntries.filter(e => e.type === "income").reduce((sum, e) => sum + e.amount, 0);
    const expenses = monthEntries.filter(e => e.type === "expense").reduce((sum, e) => sum + e.amount, 0);

    return {
      name: format(date, 'MMM'),
      income,
      expenses,
      net: income - expenses
    };
  });

  // Category breakdown for pie chart
  const categoryData = categories.map(cat => ({
    name: cat,
    value: budgetEntries.filter(e => e.category === cat && e.type === "expense").reduce((sum, e) => sum + e.amount, 0)
  })).filter(c => c.value > 0);

  // Net worth over time (cumulative)
  const netWorthOverTime = last6Months.reduce((acc, month, index) => {
    const prevNetWorth = index === 0 ? 0 : acc[index - 1].netWorth;
    acc.push({
      name: month.name,
      netWorth: prevNetWorth + month.net,
      income: month.income,
      expenses: month.expenses
    });
    return acc;
  }, []);

  // Scatter data for income vs expenses correlation
  const scatterData = last6Months.map(m => ({
    x: m.income,
    y: m.expenses,
    name: m.name
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  const renderChart = () => {
    switch(chartType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ReLineChart data={last6Months}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="net" stroke="#6366f1" strokeWidth={2} />
            </ReLineChart>
          </ResponsiveContainer>
        );
      case "area":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={last6Months}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="income" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
              <Area type="monotone" dataKey="expenses" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        );
      case "scatter":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" dataKey="x" name="Income" stroke="#64748b" label={{ value: 'Income', position: 'bottom' }} />
              <YAxis type="number" dataKey="y" name="Expenses" stroke="#64748b" label={{ value: 'Expenses', angle: -90, position: 'left' }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value, name) => [`$${value.toLocaleString()}`, name === 'x' ? 'Income' : 'Expenses']} />
              <Scatter name="Monthly" data={scatterData} fill="#6366f1">
                {scatterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RePieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RePieChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={last6Months}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Budget</h1>
            <p className="text-slate-500 mt-1">Track income and expenses</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCalculator(true)}>
              <Calculator className="w-4 h-4 mr-2" />
              Calculator
            </Button>
            <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-green-100">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Income</p>
                <p className="text-xl font-bold text-slate-900">${totalIncome.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-red-100">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Expenses</p>
                <p className="text-xl font-bold text-slate-900">${totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-100">
                <DollarSign className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Net Worth</p>
                <p className={`text-xl font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${netWorth.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-100">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Yearly Income</p>
                <p className="text-xl font-bold text-slate-900">${yearlyIncome.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Financial Overview</h2>
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              <Button 
                variant={chartType === "bar" ? "secondary" : "ghost"} 
                size="sm"
                onClick={() => setChartType("bar")}
                title="Bar Chart"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button 
                variant={chartType === "line" ? "secondary" : "ghost"} 
                size="sm"
                onClick={() => setChartType("line")}
                title="Line Chart"
              >
                <LineChart className="w-4 h-4" />
              </Button>
              <Button 
                variant={chartType === "area" ? "secondary" : "ghost"} 
                size="sm"
                onClick={() => setChartType("area")}
                title="Area Chart"
              >
                <Activity className="w-4 h-4" />
              </Button>
              <Button 
                variant={chartType === "scatter" ? "secondary" : "ghost"} 
                size="sm"
                onClick={() => setChartType("scatter")}
                title="Scatter Plot"
              >
                <CircleDot className="w-4 h-4" />
              </Button>
              <Button 
                variant={chartType === "pie" ? "secondary" : "ghost"} 
                size="sm"
                onClick={() => setChartType("pie")}
                title="Pie Chart"
              >
                <PieChart className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {renderChart()}
        </div>

        {/* Project Billing & Invoicing */}
        <ProjectInvoicePanel projects={projects} entries={timeEntries} />

        {/* Net Worth Over Time Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-6">Net Worth Over Time</h2>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={netWorthOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Area type="monotone" dataKey="netWorth" fill="#6366f1" fillOpacity={0.2} stroke="#6366f1" strokeWidth={2} name="Net Worth" />
              <Line type="monotone" dataKey="netWorth" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} name="Net Worth" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Entries */}
        <div className="bg-white rounded-2xl border border-slate-100">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-semibold">Recent Entries</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {budgetEntries.slice(0, 10).map((entry) => (
              <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${entry.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {entry.type === 'income' ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{entry.title}</p>
                    <p className="text-sm text-slate-500">{entry.category} • {format(new Date(entry.date), 'MMM d')}</p>
                  </div>
                </div>
                <p className={`font-semibold ${entry.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {entry.type === 'income' ? '+' : '-'}${entry.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Entry Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Budget Entry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Entry description"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {formData.date ? format(new Date(formData.date), 'MMM d, yyyy') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date ? new Date(formData.date + 'T12:00:00') : undefined}
                      onSelect={(d) => {
                        if (d) {
                          const year = d.getFullYear();
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const day = String(d.getDate()).padStart(2, '0');
                          setFormData({ ...formData, date: `${year}-${month}-${day}` });
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">Add Entry</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <BudgetCalculator open={showCalculator} onOpenChange={setShowCalculator} />
    </div>
  );
}