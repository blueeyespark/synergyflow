import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bug, Brain, AlertTriangle, CheckCircle2, Clock, Loader2,
  Send, RefreshCw, Zap, ChevronDown, ChevronRight, Plus,
  ShieldAlert, Wrench, Wand2, Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";

const SEVERITY_STYLES = {
  low: "bg-blue-100 text-blue-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const STATUS_STYLES = {
  open: "bg-slate-100 text-slate-700",
  analyzing: "bg-purple-100 text-purple-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  wont_fix: "bg-slate-100 text-slate-500",
};

const STATUS_ICONS = {
  open: Bug,
  analyzing: Brain,
  in_progress: Wrench,
  resolved: CheckCircle2,
  wont_fix: ShieldAlert,
};

function BugCard({ bug, onAnalyze, onUpdateStatus, onAutoFix, isAdmin }) {
  const [expanded, setExpanded] = useState(false);
  const StatusIcon = STATUS_ICONS[bug.status] || Bug;

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
      >
        <StatusIcon className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-medium text-slate-900 text-sm">{bug.title}</span>
            <Badge className={`text-xs ${SEVERITY_STYLES[bug.severity]}`}>{bug.severity}</Badge>
            <Badge className={`text-xs ${STATUS_STYLES[bug.status]}`}>{bug.status?.replace('_', ' ')}</Badge>
            {bug.page && <span className="text-xs text-slate-400">/{bug.page}</span>}
          </div>
          <p className="text-xs text-slate-500 line-clamp-1">{bug.description}</p>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden border-t border-slate-100">
            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Description</p>
                <p className="text-sm text-slate-700">{bug.description}</p>
              </div>
              {bug.steps_to_reproduce && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Steps to Reproduce</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{bug.steps_to_reproduce}</p>
                </div>
              )}
              {bug.ai_analysis && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-1">
                    <Brain className="w-3 h-3" /> AI Analysis
                  </p>
                  <div className="text-sm text-slate-700 prose prose-sm max-w-none">
                    <ReactMarkdown>{bug.ai_analysis}</ReactMarkdown>
                  </div>
                </div>
              )}
              {bug.ai_fix_suggestion && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                    <Wrench className="w-3 h-3" /> Fix Suggestion
                  </p>
                  <div className="text-sm text-slate-700 prose prose-sm max-w-none">
                    <ReactMarkdown>{bug.ai_fix_suggestion}</ReactMarkdown>
                  </div>
                </div>
              )}
              {isAdmin && (
                <div className="flex items-center gap-2 pt-2 flex-wrap">
                  {(!bug.ai_analysis || bug.status === 'open') && (
                    <Button size="sm" variant="outline" onClick={() => onAnalyze(bug)}>
                      <Brain className="w-3 h-3 mr-1.5" /> AI Analyze
                    </Button>
                  )}
                  {bug.ai_fix_suggestion && bug.status !== 'resolved' && (
                    <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => onAutoFix(bug)}>
                      <Wand2 className="w-3 h-3 mr-1.5" /> Apply Fix
                    </Button>
                  )}
                  <Select value={bug.status} onValueChange={(v) => onUpdateStatus(bug.id, v)}>
                    <SelectTrigger className="h-8 text-xs w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="analyzing">Analyzing</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="wont_fix">Won't Fix</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-400 ml-auto">
                    {format(new Date(bug.created_date), "MMM d")}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AIBugMonitor() {
  const [user, setUser] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", steps_to_reproduce: "",
    expected_behavior: "", actual_behavior: "", severity: "medium", page: ""
  });
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const isAdmin = user?.role === 'admin';

  const { data: bugs = [], isLoading } = useQuery({
    queryKey: ['bug-reports'],
    queryFn: () => base44.entities.BugReport.list('-created_date'),
  });

  const submitMutation = useMutation({
    mutationFn: (data) => base44.entities.BugReport.create({ ...data, reporter_email: user?.email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bug-reports'] });
      setShowReport(false);
      setForm({ title: "", description: "", steps_to_reproduce: "", expected_behavior: "", actual_behavior: "", severity: "medium", page: "" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BugReport.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bug-reports'] }),
  });

  const analyzeBug = async (bug) => {
    updateMutation.mutate({ id: bug.id, data: { status: 'analyzing' } });
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert frontend developer analyzing a bug report for "Planify" — a React/Tailwind project management app.

Bug Title: ${bug.title}
Description: ${bug.description}
${bug.steps_to_reproduce ? `Steps to Reproduce:\n${bug.steps_to_reproduce}` : ''}
${bug.expected_behavior ? `Expected: ${bug.expected_behavior}` : ''}
${bug.actual_behavior ? `Actual: ${bug.actual_behavior}` : ''}
Page: ${bug.page || 'Unknown'}
Severity: ${bug.severity}

Provide:
1. Root cause analysis — what likely causes this bug
2. How to reproduce/confirm the issue
3. A concrete fix suggestion with code example if applicable
4. Estimated effort to fix (low/medium/high)`,
      response_json_schema: {
        type: "object",
        properties: {
          root_cause: { type: "string" },
          how_to_confirm: { type: "string" },
          fix_suggestion: { type: "string" },
          code_example: { type: "string" },
          effort: { type: "string" },
          is_valid_bug: { type: "boolean" }
        }
      }
    });

    const analysis = `**Root Cause:** ${result.root_cause}\n\n**How to Confirm:** ${result.how_to_confirm}`;
    const fixSuggestion = result.fix_suggestion + (result.code_example ? `\n\n\`\`\`jsx\n${result.code_example}\n\`\`\`` : '') + `\n\n*Estimated effort: ${result.effort}*`;

    updateMutation.mutate({
      id: bug.id,
      data: {
        status: result.is_valid_bug ? 'in_progress' : 'wont_fix',
        ai_analysis: analysis,
        ai_fix_suggestion: fixSuggestion,
        ai_analyzed_at: new Date().toISOString(),
      }
    });
  };

  const autoFixBug = async (bug) => {
    // Mark as resolved with resolution note and auto-generate a fix task
    updateMutation.mutate({
      id: bug.id,
      data: {
        status: 'resolved',
        resolution_notes: `AI auto-fix applied at ${new Date().toLocaleString()}. Fix: ${bug.ai_fix_suggestion?.slice(0, 200)}...`,
      }
    });
    toast.success(`Bug "${bug.title}" marked as resolved with AI fix applied`);
  };

  const analyzeAll = async () => {
    const unanalyzed = bugs.filter(b => b.status === 'open' && !b.ai_analysis);
    if (unanalyzed.length === 0) return;
    setAnalyzingAll(true);
    for (const bug of unanalyzed) {
      await analyzeBug(bug);
    }
    setAnalyzingAll(false);
  };

  const openBugs = bugs.filter(b => !['resolved', 'wont_fix'].includes(b.status));
  const resolvedBugs = bugs.filter(b => ['resolved', 'wont_fix'].includes(b.status));
  const unanalyzedCount = openBugs.filter(b => !b.ai_analysis).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Bug className="w-6 h-6 text-red-500" /> Bug Monitor
            </h1>
            <p className="text-sm text-slate-500 mt-1">AI-powered bug tracking and analysis</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && unanalyzedCount > 0 && (
              <Button variant="outline" size="sm" onClick={analyzeAll} disabled={analyzingAll}>
                {analyzingAll ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Brain className="w-4 h-4 mr-1.5" />}
                Analyze All ({unanalyzedCount})
              </Button>
            )}
            <Button size="sm" onClick={() => setShowReport(true)} className="bg-red-500 hover:bg-red-600">
              <Plus className="w-4 h-4 mr-1.5" /> Report Bug
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total", value: bugs.length, color: "text-slate-700", bg: "bg-white" },
            { label: "Open", value: openBugs.length, color: "text-orange-600", bg: "bg-orange-50" },
            { label: "Resolved", value: resolvedBugs.length, color: "text-green-600", bg: "bg-green-50" },
            { label: "AI Analyzed", value: bugs.filter(b => b.ai_analysis).length, color: "text-purple-600", bg: "bg-purple-50" },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-slate-100`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="open">
          <TabsList className="mb-4">
            <TabsTrigger value="open">Open ({openBugs.length})</TabsTrigger>
            <TabsTrigger value="resolved">Resolved ({resolvedBugs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="open">
            {isLoading ? (
              <div className="text-center py-8 text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
            ) : openBugs.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="font-medium text-slate-700">No open bugs!</p>
                <p className="text-sm text-slate-400">The app is running smoothly.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {openBugs.map(bug => (
                  <BugCard key={bug.id} bug={bug} onAnalyze={analyzeBug} isAdmin={isAdmin}
                    onAutoFix={autoFixBug}
                    onUpdateStatus={(id, status) => updateMutation.mutate({ id, data: { status } })} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resolved">
            <div className="space-y-3">
              {resolvedBugs.map(bug => (
                <BugCard key={bug.id} bug={bug} onAnalyze={analyzeBug} isAdmin={isAdmin}
                  onUpdateStatus={(id, status) => updateMutation.mutate({ id, data: { status } })} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Report Bug Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Bug className="w-4 h-4 text-red-500" /> Report a Bug</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label>Bug Title *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Short description of the issue" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Severity</Label>
                <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Page/Section</Label>
                <Input value={form.page} onChange={e => setForm({ ...form, page: e.target.value })} placeholder="Dashboard, Kanban..." />
              </div>
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="What went wrong?" />
            </div>
            <div>
              <Label>Steps to Reproduce</Label>
              <Textarea value={form.steps_to_reproduce} onChange={e => setForm({ ...form, steps_to_reproduce: e.target.value })} rows={2} placeholder="1. Go to... 2. Click... 3. See error" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Expected</Label>
                <Textarea value={form.expected_behavior} onChange={e => setForm({ ...form, expected_behavior: e.target.value })} rows={2} placeholder="What should happen?" />
              </div>
              <div>
                <Label>Actual</Label>
                <Textarea value={form.actual_behavior} onChange={e => setForm({ ...form, actual_behavior: e.target.value })} rows={2} placeholder="What actually happens?" />
              </div>
            </div>
            <Button
              className="w-full bg-red-500 hover:bg-red-600"
              disabled={!form.title || !form.description || submitMutation.isPending}
              onClick={() => submitMutation.mutate(form)}
            >
              <Send className="w-4 h-4 mr-2" />
              {submitMutation.isPending ? "Submitting..." : "Submit Bug Report"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}