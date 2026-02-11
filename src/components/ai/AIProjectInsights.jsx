import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { format, differenceInDays, isPast } from "date-fns";
import { 
  Brain, TrendingUp, AlertTriangle, Users, FileText, 
  Loader2, BarChart3, Target, Clock, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function AIProjectInsights({ 
  open, 
  onOpenChange, 
  projects,
  tasks,
  budget,
  teamMembers
}) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const analyzeProjects = async () => {
    setLoading(true);
    
    // Calculate metrics locally first
    const metrics = calculateMetrics();
    
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this project portfolio and provide insights:

Projects: ${projects?.length || 0}
Tasks: ${tasks?.length || 0}
- Completed: ${metrics.completedTasks}
- In Progress: ${metrics.inProgressTasks}
- Overdue: ${metrics.overdueTasks}
- Blocked (by dependencies): ${metrics.blockedTasks}

Team Members: ${teamMembers?.length || 0}
Workload Distribution:
${metrics.workloadByMember.map(m => `- ${m.name}: ${m.tasks} tasks (${m.completed} completed)`).join('\n')}

Budget:
- Total Income: $${metrics.totalIncome}
- Total Expenses: $${metrics.totalExpenses}
- Net: $${metrics.netBudget}

Upcoming Deadlines (next 7 days): ${metrics.upcomingDeadlines}
Projects at Risk: ${metrics.projectsAtRisk.map(p => p.name).join(', ') || 'None'}

Provide:
1. Overall portfolio health assessment (healthy/warning/critical)
2. Top 3 risks or bottlenecks with specific recommendations
3. Resource allocation suggestions (who is overloaded, who has capacity)
4. Key metrics summary
5. Recommended actions for the next week`,
        response_json_schema: {
          type: "object",
          properties: {
            health_status: { type: "string", enum: ["healthy", "warning", "critical"] },
            health_score: { type: "number" },
            summary: { type: "string" },
            risks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  severity: { type: "string", enum: ["low", "medium", "high"] },
                  description: { type: "string" },
                  recommendation: { type: "string" }
                }
              }
            },
            resource_insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  member: { type: "string" },
                  status: { type: "string", enum: ["overloaded", "balanced", "underutilized"] },
                  suggestion: { type: "string" }
                }
              }
            },
            recommended_actions: {
              type: "array",
              items: { type: "string" }
            },
            metrics_highlights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  value: { type: "string" },
                  trend: { type: "string", enum: ["up", "down", "stable"] }
                }
              }
            }
          }
        }
      });
      
      setInsights({ ...response, localMetrics: metrics });
    } catch (error) {
      toast.error("Failed to analyze projects");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateStatusReport = async () => {
    setLoading(true);
    
    const metrics = calculateMetrics();
    
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a professional project status report for the following data:

Date: ${format(new Date(), 'MMMM d, yyyy')}

Portfolio Summary:
- ${projects?.length || 0} active projects
- ${tasks?.length || 0} total tasks
- ${metrics.completionRate}% overall completion rate
- ${metrics.overdueTasks} overdue tasks

Projects:
${projects?.slice(0, 5).map(p => {
  const projectTasks = tasks?.filter(t => t.project_id === p.id) || [];
  const completed = projectTasks.filter(t => t.status === 'completed').length;
  return `- ${p.name}: ${completed}/${projectTasks.length} tasks complete (${p.status})`;
}).join('\n')}

Budget Status:
- Income: $${metrics.totalIncome.toLocaleString()}
- Expenses: $${metrics.totalExpenses.toLocaleString()}
- Net: $${metrics.netBudget.toLocaleString()}

Generate a concise, professional status report with:
1. Executive summary (2-3 sentences)
2. Key accomplishments this period
3. Current challenges
4. Next steps and priorities
5. Resource needs (if any)`,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            accomplishments: { type: "array", items: { type: "string" } },
            challenges: { type: "array", items: { type: "string" } },
            next_steps: { type: "array", items: { type: "string" } },
            resource_needs: { type: "array", items: { type: "string" } },
            report_date: { type: "string" }
          }
        }
      });
      
      setInsights({ ...insights, statusReport: response });
      setActiveTab('report');
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = () => {
    const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
    const inProgressTasks = tasks?.filter(t => t.status === 'in_progress').length || 0;
    const totalTasks = tasks?.length || 0;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const overdueTasks = tasks?.filter(t => 
      t.due_date && isPast(new Date(t.due_date + 'T23:59:59')) && t.status !== 'completed'
    ).length || 0;
    
    const blockedTasks = tasks?.filter(t => {
      if (!t.depends_on?.length) return false;
      return t.depends_on.some(depId => {
        const depTask = tasks.find(dt => dt.id === depId);
        return depTask && depTask.status !== 'completed';
      });
    }).length || 0;

    const upcomingDeadlines = tasks?.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      const daysUntil = differenceInDays(new Date(t.due_date), new Date());
      return daysUntil >= 0 && daysUntil <= 7;
    }).length || 0;

    const workloadByMember = (teamMembers || []).map(email => {
      const memberTasks = tasks?.filter(t => t.assigned_to === email) || [];
      const completed = memberTasks.filter(t => t.status === 'completed').length;
      return {
        name: email.split('@')[0],
        email,
        tasks: memberTasks.length,
        completed,
        inProgress: memberTasks.filter(t => t.status === 'in_progress').length
      };
    });

    const projectsAtRisk = projects?.filter(p => {
      const projectTasks = tasks?.filter(t => t.project_id === p.id) || [];
      const overdue = projectTasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && t.status !== 'completed');
      return overdue.length > projectTasks.length * 0.2; // More than 20% overdue
    }) || [];

    const totalIncome = budget?.filter(b => b.type === 'income').reduce((sum, b) => sum + b.amount, 0) || 0;
    const totalExpenses = budget?.filter(b => b.type === 'expense').reduce((sum, b) => sum + b.amount, 0) || 0;

    return {
      completedTasks,
      inProgressTasks,
      totalTasks,
      completionRate,
      overdueTasks,
      blockedTasks,
      upcomingDeadlines,
      workloadByMember,
      projectsAtRisk,
      totalIncome,
      totalExpenses,
      netBudget: totalIncome - totalExpenses
    };
  };

  const healthColors = {
    healthy: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    critical: 'bg-red-100 text-red-700'
  };

  const severityColors = {
    low: 'bg-blue-100 text-blue-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700'
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            AI Project Insights
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {!insights ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="font-semibold mb-2">Analyze Your Projects</h3>
              <p className="text-sm text-slate-500 mb-4">Get AI-powered insights about your project portfolio</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={analyzeProjects} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
                  Analyze Portfolio
                </Button>
                <Button variant="outline" onClick={generateStatusReport} disabled={loading}>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                <TabsTrigger value="risks" className="flex-1">Risks</TabsTrigger>
                <TabsTrigger value="resources" className="flex-1">Resources</TabsTrigger>
                <TabsTrigger value="report" className="flex-1">Report</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                {/* Health Status */}
                <div className={`p-4 rounded-xl ${healthColors[insights.health_status]}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold capitalize">{insights.health_status} Portfolio</span>
                    <span className="text-2xl font-bold">{insights.health_score || 75}%</span>
                  </div>
                  <Progress value={insights.health_score || 75} className="h-2" />
                  <p className="text-sm mt-2">{insights.summary}</p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  {insights.metrics_highlights?.map((metric, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500">{metric.label}</p>
                      <p className="text-lg font-bold">{metric.value}</p>
                    </div>
                  ))}
                </div>

                {/* Recommended Actions */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Recommended Actions
                  </h4>
                  <ul className="space-y-2">
                    {insights.recommended_actions?.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs flex-shrink-0">
                          {i + 1}
                        </span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="risks" className="space-y-3 mt-4">
                {insights.risks?.length > 0 ? (
                  insights.risks.map((risk, i) => (
                    <div key={i} className="p-4 border rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className={`w-4 h-4 ${risk.severity === 'high' ? 'text-red-500' : risk.severity === 'medium' ? 'text-amber-500' : 'text-blue-500'}`} />
                        <span className="font-medium">{risk.title}</span>
                        <Badge className={severityColors[risk.severity]}>{risk.severity}</Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{risk.description}</p>
                      <div className="p-2 bg-green-50 rounded text-sm text-green-700">
                        💡 {risk.recommendation}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-400 py-8">No significant risks identified</p>
                )}
              </TabsContent>

              <TabsContent value="resources" className="space-y-3 mt-4">
                {insights.resource_insights?.map((resource, i) => (
                  <div key={i} className="p-4 border rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium">
                        {resource.member?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{resource.member}</span>
                      <Badge className={
                        resource.status === 'overloaded' ? 'bg-red-100 text-red-700' :
                        resource.status === 'underutilized' ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      }>
                        {resource.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{resource.suggestion}</p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="report" className="mt-4">
                {insights.statusReport ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-indigo-50 rounded-xl">
                      <h4 className="font-semibold mb-2">Executive Summary</h4>
                      <p className="text-sm">{insights.statusReport.executive_summary}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Key Accomplishments</h4>
                      <ul className="space-y-1">
                        {insights.statusReport.accomplishments?.map((item, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-green-500">✓</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Current Challenges</h4>
                      <ul className="space-y-1">
                        {insights.statusReport.challenges?.map((item, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-amber-500">⚠</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Next Steps</h4>
                      <ul className="space-y-1">
                        {insights.statusReport.next_steps?.map((item, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-indigo-500">→</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Button onClick={generateStatusReport} disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                      Generate Status Report
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {insights && (
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" size="sm" onClick={() => setInsights(null)}>
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={analyzeProjects} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh Analysis'}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}