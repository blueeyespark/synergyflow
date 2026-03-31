import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FileText, Send, Loader2, RefreshCw, Mail, Calendar, CheckCircle2, DollarSign, TrendingUp, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, subDays, parseISO, isWithinInterval } from "date-fns";
import ReactMarkdown from "react-markdown";

export default function WeeklyReports() {
  const [user, setUser] = useState(null);
  const [selectedProject, setSelectedProject] = useState("all");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [report, setReport] = useState(null);
  const [emailTo, setEmailTo] = useState("");

  useEffect(() => { base44.auth.me().then(u => { setUser(u); }); }, []);

  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => base44.entities.Project.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => base44.entities.Task.list() });
  const { data: budget = [] } = useQuery({ queryKey: ["budget"], queryFn: () => base44.entities.Budget.list() });

  if (user && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center p-8">
          <Lock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Admin access required</p>
        </div>
      </div>
    );
  }

  const weekStart = subDays(new Date(), 7);

  const filteredTasks = tasks.filter(t => {
    const inProject = selectedProject === "all" || t.project_id === selectedProject;
    return inProject;
  });

  const completedThisWeek = filteredTasks.filter(t =>
    t.completed_at && new Date(t.completed_at) >= weekStart
  );

  const upcoming = filteredTasks.filter(t =>
    t.status !== "completed" && t.due_date && new Date(t.due_date + "T12:00:00") >= new Date()
  ).sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).slice(0, 10);

  const totalIncome = budget.filter(b => b.type === "income").reduce((s, b) => s + b.amount, 0);
  const totalExpense = budget.filter(b => b.type === "expense").reduce((s, b) => s + b.amount, 0);

  const generateReport = async () => {
    setGenerating(true);
    setReport(null);

    const projectSummary = (selectedProject === "all" ? projects : projects.filter(p => p.id === selectedProject))
      .map(p => {
        const ptasks = filteredTasks.filter(t => t.project_id === p.id);
        const done = ptasks.filter(t => t.status === "completed").length;
        return `${p.name} (${p.status}): ${done}/${ptasks.length} tasks done`;
      }).join("\n");

    const completedSummary = completedThisWeek.slice(0, 20).map(t => `- ${t.title} (${t.priority || "medium"} priority)`).join("\n");
    const upcomingSummary = upcoming.slice(0, 10).map(t => `- ${t.title} due ${t.due_date}`).join("\n");

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a professional weekly progress report for stakeholders. Use markdown formatting with clear sections. Be concise but informative.

WEEK: ${format(weekStart, "MMM d")} – ${format(new Date(), "MMM d, yyyy")}

PROJECTS:
${projectSummary || "No projects"}

COMPLETED THIS WEEK (${completedThisWeek.length} tasks):
${completedSummary || "None"}

UPCOMING MILESTONES:
${upcomingSummary || "None scheduled"}

BUDGET:
- Total Income: $${totalIncome.toLocaleString()}
- Total Expenses: $${totalExpense.toLocaleString()}
- Net: $${(totalIncome - totalExpense).toLocaleString()}

Write an executive summary, then sections for: ✅ Completed Work, 📅 Upcoming Milestones, 💰 Budget Status, and 🚨 Risks & Blockers (inferred from overdue or high-priority tasks).`,
    });

    setReport(typeof result === "string" ? result : result?.response || "Failed to generate report.");
    setGenerating(false);
    toast.success("Report generated!");
  };

  const sendReport = async () => {
    if (!emailTo || !report) return;
    setSending(true);
    const emails = emailTo.split(",").map(e => e.trim()).filter(Boolean);
    for (const email of emails) {
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: `Weekly Progress Report — ${format(new Date(), "MMM d, yyyy")}`,
        body: report,
      });
    }
    toast.success(`Report sent to ${emails.length} recipient(s)!`);
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/20 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-500" /> Weekly Progress Reports
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">AI-generated stakeholder reports with email delivery</p>
          </div>
          <Button onClick={generateReport} disabled={generating} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            {generating ? "Generating..." : "Generate Report"}
          </Button>
        </motion.div>

        {/* Filters & Stats */}
        <div className="grid sm:grid-cols-4 gap-4 mb-6">
          <div className="sm:col-span-1">
            <Label className="text-xs text-slate-500 mb-1 block">Filter by Project</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {[
            { icon: CheckCircle2, label: "Completed This Week", value: completedThisWeek.length, color: "text-green-600 bg-green-100" },
            { icon: Calendar, label: "Upcoming Milestones", value: upcoming.length, color: "text-blue-600 bg-blue-100" },
            { icon: DollarSign, label: "Net Budget", value: `$${(totalIncome - totalExpense).toLocaleString()}`, color: "text-indigo-600 bg-indigo-100" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 flex items-center gap-3 shadow-sm">
              <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}><Icon className="w-4 h-4" /></div>
              <div><p className="text-xs text-slate-500 dark:text-slate-400">{label}</p><p className="text-lg font-bold text-slate-900 dark:text-slate-100">{value}</p></div>
            </div>
          ))}
        </div>

        {/* Report Output */}
        {!report && !generating && (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
            <FileText className="w-14 h-14 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No report generated yet</h3>
            <p className="text-sm text-slate-400 mt-1">Click "Generate Report" to create an AI-powered weekly summary</p>
          </div>
        )}

        {generating && (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
            <Loader2 className="w-10 h-10 text-indigo-500 mx-auto mb-4 animate-spin" />
            <p className="text-slate-500">AI is analyzing your project data...</p>
          </div>
        )}

        {report && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Weekly Report — {format(new Date(), "MMM d, yyyy")}</span>
                  <Badge variant="secondary">AI Generated</Badge>
                </div>
                <Button variant="outline" size="sm" onClick={generateReport} disabled={generating}>
                  <RefreshCw className="w-3 h-3 mr-1.5" /> Regenerate
                </Button>
              </div>
              <div className="p-6">
                <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
                  <ReactMarkdown>{report}</ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Email section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-500" /> Email Report to Stakeholders
              </h3>
              <div className="flex gap-3">
                <Input
                  value={emailTo}
                  onChange={e => setEmailTo(e.target.value)}
                  placeholder="stakeholder@example.com, ceo@company.com"
                  className="flex-1"
                />
                <Button onClick={sendReport} disabled={!emailTo || sending} className="bg-indigo-600 hover:bg-indigo-700">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
                  {sending ? "Sending..." : "Send"}
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-2">Separate multiple emails with commas</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}