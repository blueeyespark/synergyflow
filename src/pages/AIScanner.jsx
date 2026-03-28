import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { 
  Scan, Globe, Loader2, CheckCircle, AlertCircle, 
  Lightbulb, ExternalLink, Code, Sparkles, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";

const SELF_ISSUES_PROMPT = `You are an expert UX/UI engineer and product analyst. Analyze the following Planify app description and identify bugs, UX issues, and feature improvements:

App: Planify - A project management and collaboration platform with:
- Dashboard with project/task overview  
- Projects with Kanban board, Gantt chart, task management
- Planner with custom statuses, drag-and-drop kanban
- Calendar view for tasks and meetings
- Budget tracking with charts
- AI Assistant for task generation and project insights
- Gamification (points, badges, leaderboard)
- Team collaboration with real-time presence
- Blog/content creation with AI
- Social media management
- Reports and analytics
- Workspace switching (personal/shared)
- Dark mode
- Role-based access control with custom permissions

Provide:
1. Potential bugs or reliability issues
2. UX/UI improvements for better usability
3. Missing features that users would expect
4. Performance optimizations
5. Mobile experience improvements

Be specific and actionable.`;

export default function AIScanner() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [selfAnalysis, setSelfAnalysis] = useState(null);
  const [siteAnalysis, setSiteAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState("self");

  const analyzeSelf = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: SELF_ISSUES_PROMPT,
        response_json_schema: {
          type: "object",
          properties: {
            bugs: {
              type: "array",
              items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, severity: { type: "string" }, fix: { type: "string" } } }
            },
            ux_improvements: {
              type: "array",
              items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, impact: { type: "string" } } }
            },
            missing_features: {
              type: "array",
              items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, priority: { type: "string" } } }
            },
            performance_tips: { type: "array", items: { type: "string" } },
            mobile_improvements: { type: "array", items: { type: "string" } },
            overall_score: { type: "number" },
            summary: { type: "string" }
          }
        }
      });
      setSelfAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const analyzeSite = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze the website/app at "${url}" from a product and UX perspective. Identify:
1. Key features and functionality worth borrowing or adapting
2. UX patterns that work well
3. Design elements to consider
4. Features that are better than what Planify currently has
5. Missing features in Planify that this app has

Focus on features relevant to project management, productivity, and collaboration apps.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            site_name: { type: "string" },
            key_features: {
              type: "array",
              items: { type: "object", properties: { feature: { type: "string" }, description: { type: "string" }, adaptable: { type: "boolean" } } }
            },
            ux_patterns: { type: "array", items: { type: "string" } },
            implementation_ideas: {
              type: "array",
              items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, effort: { type: "string" } } }
            },
            summary: { type: "string" }
          }
        }
      });
      setSiteAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const severityColor = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-blue-100 text-blue-700' };
  const priorityColor = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-green-100 text-green-700' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50/30">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Scan className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">AI Scanner</h1>
          <p className="text-slate-500 mt-1">Analyze this app for improvements or scan competitor sites for inspiration</p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="self" className="flex-1">
              <Sparkles className="w-4 h-4 mr-2" /> Scan This App
            </TabsTrigger>
            <TabsTrigger value="external" className="flex-1">
              <Globe className="w-4 h-4 mr-2" /> Scan External Site
            </TabsTrigger>
          </TabsList>

          <TabsContent value="self">
            {!selfAnalysis ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-sm">
                <Scan className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Analyze Planify</h3>
                <p className="text-slate-500 mb-6">AI will scan this app and identify bugs, UX issues, and improvement opportunities.</p>
                <Button onClick={analyzeSelf} disabled={loading} size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Scan className="w-4 h-4 mr-2" />}
                  Start Analysis
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

                {/* Bugs */}
                {selfAnalysis.bugs?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <h4 className="font-semibold mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-500" />Potential Issues ({selfAnalysis.bugs.length})</h4>
                    <div className="space-y-3">
                      {selfAnalysis.bugs.map((bug, i) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={severityColor[bug.severity] || 'bg-slate-100'}>{bug.severity}</Badge>
                            <span className="font-medium text-sm">{bug.title}</span>
                          </div>
                          <p className="text-sm text-slate-600">{bug.description}</p>
                          {bug.fix && <p className="text-sm text-green-700 mt-1">💡 {bug.fix}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* UX Improvements */}
                {selfAnalysis.ux_improvements?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <h4 className="font-semibold mb-3 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500" />UX Improvements</h4>
                    <div className="space-y-2">
                      {selfAnalysis.ux_improvements.map((item, i) => (
                        <div key={i} className="p-3 bg-amber-50 rounded-lg">
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="text-sm text-slate-600">{item.description}</p>
                          {item.impact && <p className="text-xs text-amber-700 mt-1">Impact: {item.impact}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Features */}
                {selfAnalysis.missing_features?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <h4 className="font-semibold mb-3 flex items-center gap-2"><Code className="w-4 h-4 text-blue-500" />Suggested Features</h4>
                    <div className="space-y-2">
                      {selfAnalysis.missing_features.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                          <ArrowRight className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{item.title}</span>
                              <Badge className={priorityColor[item.priority] || 'bg-slate-100'}>{item.priority}</Badge>
                            </div>
                            <p className="text-sm text-slate-600">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Performance + Mobile */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {selfAnalysis.performance_tips?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                      <h4 className="font-semibold mb-3">⚡ Performance</h4>
                      <ul className="space-y-1">
                        {selfAnalysis.performance_tips.map((t, i) => <li key={i} className="text-sm text-slate-600">• {t}</li>)}
                      </ul>
                    </div>
                  )}
                  {selfAnalysis.mobile_improvements?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                      <h4 className="font-semibold mb-3">📱 Mobile</h4>
                      <ul className="space-y-1">
                        {selfAnalysis.mobile_improvements.map((t, i) => <li key={i} className="text-sm text-slate-600">• {t}</li>)}
                      </ul>
                    </div>
                  )}
                </div>

                <Button variant="outline" onClick={() => setSelfAnalysis(null)}>Re-scan</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="external">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm mb-4">
              <Label className="block mb-2">Enter a website URL to analyze</Label>
              <div className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://linear.app, https://notion.so, ..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && analyzeSite()}
                />
                <Button onClick={analyzeSite} disabled={loading || !url}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-2">Try: linear.app, notion.so, asana.com, clickup.com, trello.com</p>
            </div>

            {siteAnalysis && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">{siteAnalysis.site_name || url}</h3>
                  <p className="text-indigo-100 text-sm">{siteAnalysis.summary}</p>
                </div>

                {siteAnalysis.key_features?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <h4 className="font-semibold mb-3">Key Features to Consider</h4>
                    <div className="space-y-2">
                      {siteAnalysis.key_features.map((f, i) => (
                        <div key={i} className={`p-3 rounded-lg ${f.adaptable ? 'bg-green-50 border border-green-100' : 'bg-slate-50'}`}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{f.feature}</span>
                            {f.adaptable && <Badge className="bg-green-100 text-green-700">Adaptable</Badge>}
                          </div>
                          <p className="text-sm text-slate-600">{f.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {siteAnalysis.implementation_ideas?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <h4 className="font-semibold mb-3">Implementation Ideas for Planify</h4>
                    <div className="space-y-2">
                      {siteAnalysis.implementation_ideas.map((idea, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                          <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{idea.title}</span>
                              <Badge variant="outline" className="text-xs">{idea.effort} effort</Badge>
                            </div>
                            <p className="text-sm text-slate-600">{idea.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {siteAnalysis.ux_patterns?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <h4 className="font-semibold mb-3">Notable UX Patterns</h4>
                    <ul className="space-y-1">
                      {siteAnalysis.ux_patterns.map((p, i) => <li key={i} className="text-sm text-slate-600 flex items-start gap-2"><span className="text-indigo-500 font-bold">→</span>{p}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Label({ children, className }) {
  return <label className={`text-sm font-medium text-slate-700 ${className}`}>{children}</label>;
}