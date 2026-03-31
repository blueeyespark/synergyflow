import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { differenceInDays, parseISO, addDays, format } from "date-fns";
import { Brain, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ProjectHealthMonitor({ projects = [], tasks = [] }) {
  const [analyses, setAnalyses] = useState({});
  const [loading, setLoading] = useState(null);

  const analyzeProject = async (project) => {
    setLoading(project.id);
    const projectTasks = tasks.filter(t => t.project_id === project.id);
    const completed = projectTasks.filter(t => t.status === 'completed');
    const remaining = projectTasks.filter(t => t.status !== 'completed');

    const completionRate = projectTasks.length > 0 ? completed.length / projectTasks.length : 0;

    // Estimate velocity: tasks completed per day since project created
    const projectAgeDays = project.created_date
      ? Math.max(1, differenceInDays(new Date(), parseISO(project.created_date)))
      : 30;
    const velocity = completed.length / projectAgeDays; // tasks/day

    const estimatedDaysLeft = velocity > 0 ? Math.ceil(remaining.length / velocity) : null;
    const estimatedEndDate = estimatedDaysLeft !== null ? addDays(new Date(), estimatedDaysLeft) : null;

    const scheduledEnd = project.due_date ? parseISO(project.due_date) : null;
    const daysUntilDue = scheduledEnd ? differenceInDays(scheduledEnd, new Date()) : null;

    const isBehind = estimatedDaysLeft !== null && daysUntilDue !== null && estimatedDaysLeft > daysUntilDue;
    const overdueDays = isBehind ? estimatedDaysLeft - daysUntilDue : 0;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this project health and provide a concise 2-sentence assessment:
Project: "${project.name}"
Status: ${project.status}
Completion: ${Math.round(completionRate * 100)}% (${completed.length}/${projectTasks.length} tasks)
Team velocity: ${velocity.toFixed(2)} tasks/day
Estimated days to finish: ${estimatedDaysLeft ?? 'unknown'}
Scheduled due date: ${project.due_date || 'none'}
Days until due: ${daysUntilDue ?? 'none'}
Behind schedule: ${isBehind ? `Yes, by ~${overdueDays} days` : 'No'}

Give a direct health assessment and one concrete recommendation. Be brief.`,
      response_json_schema: {
        type: "object",
        properties: {
          assessment: { type: "string" },
          recommendation: { type: "string" },
          health_score: { type: "number" }
        }
      }
    });

    const analysis = {
      completionRate,
      velocity,
      estimatedEndDate,
      isBehind,
      overdueDays,
      daysUntilDue,
      assessment: result.assessment,
      recommendation: result.recommendation,
      health_score: result.health_score,
    };

    setAnalyses(prev => ({ ...prev, [project.id]: analysis }));

    // Alert owner if behind schedule
    if (isBehind && project.owner_email) {
      await base44.entities.Notification.create({
        user_email: project.owner_email,
        type: 'project_update',
        title: `⚠️ "${project.name}" is trending behind schedule`,
        message: `At current velocity, the project will finish ~${overdueDays} days late. ${result.recommendation}`,
        project_id: project.id,
        is_read: false,
      });
      toast.warning(`Alert sent: "${project.name}" is behind schedule`);
    }

    setLoading(null);
  };

  const activeProjects = projects.filter(p => p.status !== 'completed');

  if (!activeProjects.length) return null;

  return (
    <div className="space-y-3">
      {activeProjects.map(project => {
        const a = analyses[project.id];
        const isLoading = loading === project.id;
        return (
          <div key={project.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-800">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: project.color || '#6366f1' }} />
                <span className="font-medium text-sm text-slate-800 dark:text-slate-100 truncate">{project.name}</span>
                {a && (
                  <Badge className={`text-xs flex-shrink-0 ${
                    a.isBehind ? 'bg-red-100 text-red-700' :
                    a.health_score >= 7 ? 'bg-green-100 text-green-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {a.isBehind ? <AlertTriangle className="w-3 h-3 mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                    {a.isBehind ? `Behind ~${a.overdueDays}d` : `On Track`}
                  </Badge>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={() => analyzeProject(project)} disabled={isLoading} className="flex-shrink-0 text-xs">
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Brain className="w-3 h-3 mr-1" />}
                Analyze
              </Button>
            </div>

            {a && (
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                    <p className="text-xs text-slate-500">Completion</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{Math.round(a.completionRate * 100)}%</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                    <p className="text-xs text-slate-500">Velocity</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{a.velocity.toFixed(1)}/day</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2">
                    <p className="text-xs text-slate-500">Est. End</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {a.estimatedEndDate ? format(a.estimatedEndDate, 'MMM d') : '?'}
                    </p>
                  </div>
                </div>
                {a.assessment && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-2.5">
                    <p>{a.assessment}</p>
                    {a.recommendation && <p className="mt-1 font-medium text-indigo-700 dark:text-indigo-300">💡 {a.recommendation}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}