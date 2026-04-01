import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Scan, Globe, Loader2, CheckCircle, AlertCircle,
  Lightbulb, Code, Sparkles, ArrowRight, Wand2, Bug,
  Plus, Check, Zap, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import CodePreviewModal from "@/components/scanner/CodePreviewModal";

const SELF_ISSUES_PROMPT = `You are an expert UX/UI engineer and product analyst. Analyze the following Planify app description and identify bugs, UX issues, and feature improvements:

App: Planify - A project management and collaboration platform with:
- Dashboard with project/task overview  
- Projects with Kanban board, Gantt chart, task management
- Planner with custom statuses, drag-and-drop kanban
- Tasks page with full Kanban drag-and-drop across all projects
- Workload Dashboard showing team capacity vs allocation with AI rebalancing
- Analytics page with charts: task completion over time, workload distribution, billable hours
- Calendar view for tasks and meetings
- Budget tracking with charts
- AI Assistant (sentient, mood-aware) for task generation and project insights
- Time tracking with billable hours, CSV export
- Gamification (points, badges, leaderboard)
- Team collaboration with real-time presence
- Blog/content creation with AI
- Social media management
- Reports and analytics
- Workspace switching (personal/shared)
- Dark mode
- Role-based access control with custom permissions
- AI Bug Monitor for reporting and analyzing bugs
- Project Templates library
- AI Scanner for self-analysis and competitor scanning

Provide:
1. Potential bugs or reliability issues (be specific to the features listed)
2. UX/UI improvements for better usability
3. Missing features that users would expect in a PM app
4. Performance optimizations
5. Mobile experience improvements

Be specific and actionable. Reference actual features.`;

export default function AIScanner() {
  const [user, setUser] = useState(null);
  const [ownerKey, setOwnerKey] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [keyError, setKeyError] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.email?.toLowerCase().includes('blueeyespark') || u?.full_name?.toLowerCase().includes('blueeyespark')) {
        setUnlocked(true);
      }
    });
  }, []);

  const handleUnlock = () => {
    if (ownerKey === 'blueeyespark') {
      setUnlocked(true);
      setKeyError(false);
    } else {
      setKeyError(true);
    }
  };
  const [implementing, setImplementing] = useState(null);
  const [selfAnalysis, setSelfAnalysis] = useState(null);
  const [siteAnalysis, setSiteAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState("self");
  const [codeModal, setCodeModal] = useState(null);
  const [autoFixingBugs, setAutoFixingBugs] = useState(false);
  const [appliedItems, setAppliedItems] = useState(new Set());
  const [autoApplying, setAutoApplying] = useState(false);
  const queryClient = useQueryClient();

  // Auto-apply: generates code, logs it silently, no confirmation needed
  const autoApplyCode = async (item, type) => {
    const key = `${type}-${item.title}`;
    setAutoApplying(key);
    toast.loading(`Auto-coding "${item.title}"...`, { id: key });
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert React/Tailwind developer working on Planify. Auto-implement this suggestion:

Title: "${item.title}"
Description: "${item.description || ''}"
Type: ${type}

Generate a complete, production-ready implementation. Provide:
1. The EXACT file path to create/modify (e.g. components/FeatureName.jsx or pages/FeatureName.jsx)
2. The FULL component code ready to copy-paste
3. A one-sentence summary of what was built

Rules: Use React hooks, Tailwind CSS, shadcn/ui (@/components/ui/), lucide-react (valid icons only), base44 SDK (import { base44 } from '@/api/base44Client'), export default function ComponentName() pattern.`,
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: "object",
        properties: {
          code: { type: "string" },
          file_path: { type: "string" },
          explanation: { type: "string" }
        }
      }
    });
    // Auto-log to AIAppliedChange — no confirmation needed
    await base44.entities.AIAppliedChange.create({
      title: item.title,
      source: 'self_scan',
      change_type: type === 'ux' ? 'ux_improvement' : type === 'feature' ? 'feature' : 'other',
      file_path: result.file_path || '',
      code_snippet: result.code || '',
      explanation: result.explanation || '',
      applied_by: user?.email || 'ai-scanner',
    });
    setAutoApplying(null);
    setAppliedItems(prev => new Set([...prev, key]));
    toast.success(`✅ "${item.title}" applied & logged`, { id: key });
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50/30 dark:from-slate-900 dark:to-purple-950/20 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">Owner Access Required</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">The AI Scanner is restricted to owners only. Enter your owner key to continue.</p>
          <Input
            type="password"
            placeholder="Enter owner key..."
            value={ownerKey}
            onChange={e => { setOwnerKey(e.target.value); setKeyError(false); }}
            onKeyDown={e => e.key === 'Enter' && handleUnlock()}
            className={keyError ? 'border-red-400 mb-1' : 'mb-1'}
          />
          {keyError && <p className="text-xs text-red-500 mb-3">Invalid owner key.</p>}
          <Button className="w-full mt-3 bg-gradient-to-r from-purple-600 to-indigo-600" onClick={handleUnlock}>
            <Lock className="w-4 h-4 mr-2" /> Unlock
          </Button>
        </div>
      </div>
    );
  }

  const severityColor = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-blue-100 text-blue-700', critical: 'bg-red-200 text-red-800' };
  const priorityColor = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-green-100 text-green-700' };

  const analyzeSelf = async () => {
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: SELF_ISSUES_PROMPT,
      response_json_schema: {
        type: "object",
        properties: {
          bugs: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, severity: { type: "string" }, fix: { type: "string" }, page: { type: "string" } } } },
          ux_improvements: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, impact: { type: "string" } } } },
          missing_features: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, priority: { type: "string" } } } },
          performance_tips: { type: "array", items: { type: "string" } },
          mobile_improvements: { type: "array", items: { type: "string" } },
          overall_score: { type: "number" },
          summary: { type: "string" }
        }
      }
    });
    setSelfAnalysis(result);
    setLoading(false);
  };

  // Auto-create all bugs as BugReport entities
  const autoCreateBugReports = async () => {
    if (!selfAnalysis?.bugs?.length) return;
    setAutoFixingBugs(true);
    let created = 0;
    for (const bug of selfAnalysis.bugs) {
      await base44.entities.BugReport.create({
        title: bug.title,
        description: bug.description,
        severity: bug.severity || 'medium',
        status: 'open',
        page: bug.page || '',
        steps_to_reproduce: `AI Scanner detected this issue.\nSuggested fix: ${bug.fix || 'See description.'}`,
        reporter_email: 'ai-scanner@planify',
      });
      created++;
    }
    queryClient.invalidateQueries({ queryKey: ['bug-reports'] });
    toast.success(`${created} bugs automatically created in Bug Monitor`);
    setAutoFixingBugs(false);
  };

  // Generate implementation code for a UX improvement or missing feature
  const implementSuggestion = async (item, type) => {
    const key = `${type}-${item.title}`;
    setImplementing(key);
    toast.loading(`Generating code for "${item.title}"...`, { id: key });
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert React/Tailwind developer working on "Planify" — a project management app built with React, Tailwind CSS, shadcn/ui, and base44 SDK.

Feature/Improvement to implement: "${item.title}"
Description: "${item.description}"
Type: ${type}

Generate a complete, production-ready React component or code snippet. Use:
- React hooks (useState, useEffect, etc.)
- Tailwind CSS for styling
- lucide-react for icons (only valid icons)
- base44 SDK: import { base44 } from '@/api/base44Client'; then base44.entities.Name.method()
- shadcn/ui from @/components/ui/
- export default function ComponentName() pattern

Return the full component code, the suggested file path (e.g., components/featureName/Component.jsx), and a brief explanation.`,
      response_json_schema: {
        type: "object",
        properties: {
          code: { type: "string" },
          file_path: { type: "string" },
          explanation: { type: "string" }
        }
      }
    });
    setImplementing(null);
    setAppliedItems(prev => new Set([...prev, key]));
    toast.success(`Code ready for "${item.title}"`, { id: key });
    setCodeModal({
      title: item.title,
      code: result.code || '// No code generated',
      description: result.explanation,
      filePath: result.file_path,
    });
  };

  // Generate implementation from external site feature — shows code modal
  const implementExternalFeature = async (feature) => {
    const key = `ext-${feature.feature}`;
    setImplementing(key);
    toast.loading(`Generating code for "${feature.feature}"...`, { id: key });
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert React/Tailwind developer working on "Planify" — a project management app.

Adapt this feature from ${siteAnalysis?.site_name || url} for Planify:
Feature: "${feature.feature}"
Description: "${feature.description}"
How it works: "${feature.how_it_works || feature.description}"
Implementation steps: "${feature.implementation_steps || ''}"

Generate a COMPLETE, PRODUCTION-READY React component for this feature:
- Use Tailwind CSS, shadcn/ui (@/components/ui/), lucide-react (only valid icons), base44 SDK
- import { base44 } from '@/api/base44Client'
- export default function ComponentName() pattern
- Include dark mode support (dark: classes)
- Include all state management, data fetching, and UI logic
- The code must be fully functional and copy-paste ready

Return the FULL component code (not a snippet), the suggested file path, and a brief explanation.`,
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: "object",
        properties: {
          code: { type: "string" },
          file_path: { type: "string" },
          explanation: { type: "string" }
        }
      }
    });
    // Log to AIAppliedChange
    await base44.entities.AIAppliedChange.create({
      title: feature.feature,
      source: 'external_scan',
      change_type: 'feature',
      file_path: result.file_path || '',
      code_snippet: result.code || '',
      explanation: result.explanation || '',
      applied_by: user?.email || 'ai-scanner',
      origin_site: siteAnalysis?.site_name || url,
    }).catch(() => {});
    setImplementing(null);
    setAppliedItems(prev => new Set([...prev, key]));
    toast.success(`Code ready for "${feature.feature}"`, { id: key });
    // Show the code modal
    setCodeModal({
      title: feature.feature,
      code: result.code || '// No code generated',
      description: result.explanation,
      filePath: result.file_path,
    });
  };

  const analyzeSite = async () => {
    if (!url) return;
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a senior product engineer performing a deep technical audit of the website at "${url}". 

Visit the site and analyze it thoroughly:
1. List every major FUNCTION and FEATURE you can identify (navigation, forms, actions, modals, data flows, integrations, etc.)
2. For each function describe exactly how it works and what it does
3. Identify the UX patterns and interaction models used
4. Find features that Planify (a React/Tailwind project management app) does NOT have but should
5. For each adaptable feature, describe step-by-step HOW to implement it in React/Tailwind

Planify already has: Dashboard, Projects/Kanban, Tasks, Workload, Analytics, Time Tracking, Calendar, Budget, AI Assistant, Planner, Leaderboard, Templates, Blog, Social Media, Reports, Video/Creator Studio.

Be very specific — list actual UI components, data interactions, and implementation approaches. Think like a developer who wants to replicate the best parts.`,
      add_context_from_internet: true,
      model: 'gemini_3_pro',
      response_json_schema: {
        type: "object",
        properties: {
          site_name: { type: "string" },
          site_description: { type: "string" },
          detected_functions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                category: { type: "string" },
                description: { type: "string" },
                how_it_works: { type: "string" }
              }
            }
          },
          key_features: {
            type: "array",
            items: {
              type: "object",
              properties: {
                feature: { type: "string" },
                description: { type: "string" },
                adaptable: { type: "boolean" },
                planify_fit: { type: "string" },
                implementation_steps: { type: "string" }
              }
            }
          },
          ux_patterns: { type: "array", items: { type: "string" } },
          implementation_ideas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                effort: { type: "string" },
                planify_page: { type: "string" }
              }
            }
          },
          summary: { type: "string" }
        }
      }
    });
    setSiteAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50/30 dark:from-slate-900 dark:to-purple-950/20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Scan className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">AI Scanner</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Scan this app for issues, or analyze competitor sites and auto-implement improvements</p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="self" className="flex-1"><Sparkles className="w-4 h-4 mr-2" />Scan This App</TabsTrigger>
            <TabsTrigger value="external" className="flex-1"><Globe className="w-4 h-4 mr-2" />Scan External Site</TabsTrigger>
          </TabsList>

          {/* ── SELF SCAN ── */}
          <TabsContent value="self">
            {!selfAnalysis ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-8 text-center shadow-sm">
                <Scan className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">Analyze Planify</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">AI will scan this app and identify bugs, UX issues, and improvement opportunities. Bugs are auto-created in Bug Monitor. Features can be auto-implemented with code.</p>
                <Button onClick={analyzeSelf} disabled={loading} size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Scan className="w-4 h-4 mr-2" />}
                  Start Full Analysis
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Score */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">App Health Score</h3>
                    <span className="text-5xl font-bold">{selfAnalysis.overall_score}/10</span>
                  </div>
                  <p className="text-purple-100 text-sm">{selfAnalysis.summary}</p>
                </div>

                {/* Bugs — with auto-create */}
                {selfAnalysis.bugs?.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                        <AlertCircle className="w-4 h-4 text-red-500" /> Potential Issues ({selfAnalysis.bugs.length})
                      </h4>
                      <Button size="sm" variant="outline" onClick={autoCreateBugReports} disabled={autoFixingBugs}
                        className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs gap-1.5">
                        {autoFixingBugs ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bug className="w-3 h-3" />}
                        Auto-Create All Bug Reports
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {selfAnalysis.bugs.map((bug, i) => (
                        <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={severityColor[bug.severity] || 'bg-slate-100'}>{bug.severity}</Badge>
                            <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{bug.title}</span>
                            {bug.page && <span className="text-xs text-slate-400 ml-auto">/{bug.page}</span>}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{bug.description}</p>
                          {bug.fix && <p className="text-sm text-green-700 dark:text-green-400 mt-1">💡 {bug.fix}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* UX Improvements — with auto-implement */}
                {selfAnalysis.ux_improvements?.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100">
                      <Lightbulb className="w-4 h-4 text-amber-500" /> UX Improvements
                    </h4>
                    <div className="space-y-2">
                      {selfAnalysis.ux_improvements.map((item, i) => {
                        const key = `ux-${item.title}`;
                        const isApplied = appliedItems.has(key);
                        return (
                          <div key={i} className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{item.title}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                                {item.impact && <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Impact: {item.impact}</p>}
                              </div>
                                      <div className="flex gap-1 flex-shrink-0">
                                <Button size="sm" variant="outline"
                                  className={`text-xs gap-1 ${isApplied ? 'text-green-600 border-green-300' : 'text-indigo-600 border-indigo-200 hover:bg-indigo-50'}`}
                                  onClick={() => implementSuggestion(item, 'ux')}
                                  disabled={implementing === key || autoApplying === key}
                                >
                                  {implementing === key ? <Loader2 className="w-3 h-3 animate-spin" /> : isApplied ? <Check className="w-3 h-3" /> : <Wand2 className="w-3 h-3" />}
                                  {isApplied ? 'View' : 'Preview'}
                                </Button>
                                <Button size="sm"
                                  className="text-xs gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                                  onClick={() => autoApplyCode(item, 'ux')}
                                  disabled={implementing === key || autoApplying === key}
                                  title="AI auto-generates and applies code"
                                >
                                  {autoApplying === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                  Auto-Code
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Missing Features — with auto-implement */}
                {selfAnalysis.missing_features?.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-slate-900 dark:text-slate-100">
                      <Code className="w-4 h-4 text-blue-500" /> Suggested Features
                    </h4>
                    <div className="space-y-2">
                      {selfAnalysis.missing_features.map((item, i) => {
                        const key = `feat-${item.title}`;
                        const isApplied = appliedItems.has(key);
                        return (
                          <div key={i} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{item.title}</span>
                                <Badge className={priorityColor[item.priority] || 'bg-slate-100'}>{item.priority}</Badge>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <Button size="sm" variant="outline"
                                className={`text-xs gap-1 ${isApplied ? 'text-green-600 border-green-300' : 'text-blue-600 border-blue-200 hover:bg-blue-50'}`}
                                onClick={() => implementSuggestion(item, 'feature')}
                                disabled={implementing === key || autoApplying === key}
                              >
                                {implementing === key ? <Loader2 className="w-3 h-3 animate-spin" /> : isApplied ? <Check className="w-3 h-3" /> : <Wand2 className="w-3 h-3" />}
                                {isApplied ? 'View' : 'Preview'}
                              </Button>
                              <Button size="sm"
                                className="text-xs gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                                onClick={() => autoApplyCode(item, 'feature')}
                                disabled={implementing === key || autoApplying === key}
                                title="AI auto-generates and applies code"
                              >
                                {autoApplying === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                Auto-Code
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Performance + Mobile */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {selfAnalysis.performance_tips?.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
                      <h4 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">⚡ Performance</h4>
                      <ul className="space-y-1">
                        {selfAnalysis.performance_tips.map((t, i) => <li key={i} className="text-sm text-slate-600 dark:text-slate-400">• {t}</li>)}
                      </ul>
                    </div>
                  )}
                  {selfAnalysis.mobile_improvements?.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
                      <h4 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">📱 Mobile</h4>
                      <ul className="space-y-1">
                        {selfAnalysis.mobile_improvements.map((t, i) => <li key={i} className="text-sm text-slate-600 dark:text-slate-400">• {t}</li>)}
                      </ul>
                    </div>
                  )}
                </div>

                <Button variant="outline" onClick={() => { setSelfAnalysis(null); setAppliedItems(new Set()); }}>Re-scan</Button>
              </div>
            )}
          </TabsContent>

          {/* ── EXTERNAL SCAN ── */}
          <TabsContent value="external">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm mb-4">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">Enter a website URL to analyze & adapt features from</label>
              <div className="flex gap-2">
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://linear.app, https://notion.so, ..."
                  className="flex-1" onKeyDown={(e) => e.key === 'Enter' && analyzeSite()} />
                <Button onClick={analyzeSite} disabled={loading || !url}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-2">Try: linear.app, notion.so, asana.com, clickup.com, monday.com</p>
            </div>

            {siteAnalysis && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">{siteAnalysis.site_name || url}</h3>
                  <p className="text-indigo-100 text-sm">{siteAnalysis.summary}</p>
                </div>

                {siteAnalysis.detected_functions?.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
                    <h4 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">🔍 Detected Functions & Features ({siteAnalysis.detected_functions.length})</h4>
                    <div className="space-y-2">
                      {siteAnalysis.detected_functions.map((fn, i) => (
                        <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">{fn.category || 'feature'}</Badge>
                            <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{fn.name}</span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{fn.description}</p>
                          {fn.how_it_works && <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">⚙️ {fn.how_it_works}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {siteAnalysis.key_features?.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
                    <h4 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">Key Features to Adapt for Planify</h4>
                    <div className="space-y-2">
                      {siteAnalysis.key_features.map((f, i) => {
                        const key = `ext-${f.feature}`;
                        const isApplied = appliedItems.has(key);
                        return (
                          <div key={i} className={`p-3 rounded-lg ${f.adaptable ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{f.feature}</span>
                                  {f.adaptable && <Badge className="bg-green-100 text-green-700">Adaptable</Badge>}
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{f.description}</p>
                                {f.planify_fit && <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">In Planify: {f.planify_fit}</p>}
                                {f.implementation_steps && <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">📋 {f.implementation_steps}</p>}
                              </div>
                              {f.adaptable && (
                                <Button size="sm" variant="outline"
                                  className={`flex-shrink-0 text-xs gap-1 ${isApplied ? 'text-green-600 border-green-300' : 'text-green-700 border-green-300 hover:bg-green-50'}`}
                                  onClick={() => implementExternalFeature(f)}
                                  disabled={implementing === key}
                                >
                                  {implementing === key ? <Loader2 className="w-3 h-3 animate-spin" /> : isApplied ? <Check className="w-3 h-3" /> : <Code className="w-3 h-3" />}
                                  {isApplied ? 'View Code' : 'Generate Code'}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {siteAnalysis.implementation_ideas?.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
                    <h4 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">Implementation Ideas for Planify</h4>
                    <div className="space-y-2">
                      {siteAnalysis.implementation_ideas.map((idea, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{idea.title}</span>
                              <Badge variant="outline" className="text-xs">{idea.effort} effort</Badge>
                              {idea.planify_page && <span className="text-xs text-indigo-500">→ {idea.planify_page}</span>}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{idea.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {siteAnalysis.ux_patterns?.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
                    <h4 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">Notable UX Patterns</h4>
                    <ul className="space-y-1">
                      {siteAnalysis.ux_patterns.map((p, i) => (
                        <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                          <span className="text-indigo-500 font-bold">→</span>{p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Code Preview Modal */}
      {codeModal && (
        <CodePreviewModal
          open={!!codeModal}
          onOpenChange={() => setCodeModal(null)}
          title={codeModal.title}
          code={codeModal.code}
          description={codeModal.description}
          filePath={codeModal.filePath}
        />
      )}
    </div>
  );
}