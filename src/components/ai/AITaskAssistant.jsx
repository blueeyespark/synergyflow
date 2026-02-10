import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { 
  Sparkles, Wand2, Users, MessageSquare, FileText, 
  Loader2, ChevronRight, ListTree, Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";

export default function AITaskAssistant({ 
  open, 
  onOpenChange, 
  tasks, 
  teamMembers,
  comments,
  chatMessages,
  onCreateTasks,
  onAssignTask
}) {
  const [loading, setLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);

  const breakdownGoal = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Break down this goal into actionable tasks with clear titles and descriptions. Goal: "${input}"
        
Consider:
- Each task should be specific and actionable
- Include time estimates where appropriate
- Order tasks by logical sequence
- Include any dependencies between tasks`,
        response_json_schema: {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
                  estimated_hours: { type: "number" }
                }
              }
            },
            summary: { type: "string" }
          }
        }
      });
      setResult({ type: 'breakdown', data: response });
    } catch (error) {
      toast.error("Failed to break down goal");
    } finally {
      setLoading(false);
    }
  };

  const suggestAssignments = async () => {
    if (!tasks?.length || !teamMembers?.length) {
      toast.error("Need tasks and team members to suggest assignments");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      // Calculate workload for each team member
      const workload = teamMembers.map(email => ({
        email,
        currentTasks: tasks.filter(t => t.assigned_to === email && t.status !== 'completed').length
      }));

      const unassignedTasks = tasks.filter(t => !t.assigned_to && t.status !== 'completed');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Suggest task assignments based on workload balance.

Team workload:
${workload.map(w => `- ${w.email}: ${w.currentTasks} active tasks`).join('\n')}

Unassigned tasks:
${unassignedTasks.map(t => `- ${t.title} (Priority: ${t.priority})`).join('\n')}

Assign tasks to balance workload. Consider task priority - high priority tasks should go to members with less workload.`,
        response_json_schema: {
          type: "object",
          properties: {
            assignments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  task_title: { type: "string" },
                  assign_to: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            summary: { type: "string" }
          }
        }
      });
      setResult({ type: 'assignments', data: response, unassignedTasks });
    } catch (error) {
      toast.error("Failed to suggest assignments");
    } finally {
      setLoading(false);
    }
  };

  const summarizeDiscussions = async () => {
    const allContent = [
      ...(comments || []).map(c => `[Comment by ${c.author_name}]: ${c.content}`),
      ...(chatMessages || []).map(m => `[Chat by ${m.sender_name}]: ${m.content}`)
    ];

    if (allContent.length === 0) {
      toast.error("No comments or chat messages to summarize");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Summarize the key points and decisions from these discussions:

${allContent.slice(-50).join('\n')}

Provide:
1. Key discussion points
2. Decisions made
3. Action items mentioned
4. Unresolved questions`,
        response_json_schema: {
          type: "object",
          properties: {
            key_points: { type: "array", items: { type: "string" } },
            decisions: { type: "array", items: { type: "string" } },
            action_items: { type: "array", items: { type: "string" } },
            unresolved: { type: "array", items: { type: "string" } },
            summary: { type: "string" }
          }
        }
      });
      setResult({ type: 'summary', data: response });
    } catch (error) {
      toast.error("Failed to summarize discussions");
    } finally {
      setLoading(false);
    }
  };

  const generateDescription = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a detailed task description from these brief notes: "${input}"
        
Include:
- Clear objective
- Acceptance criteria
- Any technical considerations
- Potential blockers or dependencies`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            acceptance_criteria: { type: "array", items: { type: "string" } },
            suggested_priority: { type: "string", enum: ["low", "medium", "high", "urgent"] }
          }
        }
      });
      setResult({ type: 'description', data: response });
    } catch (error) {
      toast.error("Failed to generate description");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { id: 'breakdown', icon: ListTree, title: 'Break Down Goals', desc: 'Split large goals into tasks', action: breakdownGoal, needsInput: true, inputLabel: 'Enter your goal or objective' },
    { id: 'assign', icon: Users, title: 'Smart Assignment', desc: 'Suggest task assignments', action: suggestAssignments, needsInput: false },
    { id: 'summarize', icon: MessageSquare, title: 'Summarize Discussions', desc: 'Summarize comments & chat', action: summarizeDiscussions, needsInput: false },
    { id: 'describe', icon: FileText, title: 'Generate Description', desc: 'Create task from notes', action: generateDescription, needsInput: true, inputLabel: 'Enter brief notes about the task' }
  ];

  const handleCreateTasks = () => {
    if (result?.type === 'breakdown' && result.data.tasks) {
      onCreateTasks(result.data.tasks);
      toast.success(`Created ${result.data.tasks.length} tasks`);
      setResult(null);
      setInput("");
    }
  };

  const handleApplyAssignments = () => {
    if (result?.type === 'assignments' && result.data.assignments) {
      result.data.assignments.forEach(a => {
        const task = result.unassignedTasks.find(t => t.title === a.task_title);
        if (task) {
          onAssignTask(task.id, a.assign_to);
        }
      });
      toast.success("Assignments applied");
      setResult(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            AI Task Assistant
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {!activeFeature ? (
            // Feature Selection
            <>
              <p className="text-sm text-slate-500">Select an AI feature to help manage your tasks</p>
              {features.map(feature => (
                <button
                  key={feature.id}
                  onClick={() => setActiveFeature(feature)}
                  className="w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-xl text-left transition-colors flex items-center gap-3 group"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow">
                    <feature.icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{feature.title}</p>
                    <p className="text-sm text-slate-500">{feature.desc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
              ))}
            </>
          ) : (
            // Active Feature
            <>
              <Button variant="ghost" size="sm" onClick={() => { setActiveFeature(null); setResult(null); setInput(""); }}>
                ← Back
              </Button>

              <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <activeFeature.icon className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold">{activeFeature.title}</h3>
                </div>
                <p className="text-sm text-slate-600">{activeFeature.desc}</p>
              </div>

              {activeFeature.needsInput && (
                <div>
                  <Label>{activeFeature.inputLabel}</Label>
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={4}
                    placeholder="Enter details here..."
                    className="mt-1"
                  />
                </div>
              )}

              <Button 
                onClick={activeFeature.action} 
                disabled={loading || (activeFeature.needsInput && !input.trim())}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {loading ? 'Processing...' : 'Generate'}
              </Button>

              {/* Results */}
              {result && (
                <div className="mt-4 p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                  {result.type === 'breakdown' && (
                    <>
                      <p className="text-sm text-slate-600">{result.data.summary}</p>
                      <div className="space-y-2">
                        {result.data.tasks?.map((task, i) => (
                          <div key={i} className="p-3 bg-slate-50 rounded-lg">
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                            <div className="flex gap-2 mt-2">
                              <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">{task.priority}</span>
                              {task.estimated_hours && (
                                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">{task.estimated_hours}h</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button onClick={handleCreateTasks} className="w-full">
                        Create {result.data.tasks?.length} Tasks
                      </Button>
                    </>
                  )}

                  {result.type === 'assignments' && (
                    <>
                      <p className="text-sm text-slate-600">{result.data.summary}</p>
                      <div className="space-y-2">
                        {result.data.assignments?.map((a, i) => (
                          <div key={i} className="p-3 bg-slate-50 rounded-lg">
                            <p className="font-medium">{a.task_title}</p>
                            <p className="text-sm text-indigo-600">→ {a.assign_to}</p>
                            <p className="text-xs text-slate-500 mt-1">{a.reason}</p>
                          </div>
                        ))}
                      </div>
                      <Button onClick={handleApplyAssignments} className="w-full">
                        Apply Assignments
                      </Button>
                    </>
                  )}

                  {result.type === 'summary' && (
                    <>
                      <p className="text-sm text-slate-700">{result.data.summary}</p>
                      {result.data.key_points?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Key Points</h4>
                          <ul className="text-sm text-slate-600 space-y-1">
                            {result.data.key_points.map((p, i) => <li key={i}>• {p}</li>)}
                          </ul>
                        </div>
                      )}
                      {result.data.action_items?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Action Items</h4>
                          <ul className="text-sm text-slate-600 space-y-1">
                            {result.data.action_items.map((p, i) => <li key={i}>• {p}</li>)}
                          </ul>
                        </div>
                      )}
                    </>
                  )}

                  {result.type === 'description' && (
                    <>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Suggested Title</h4>
                        <p className="text-slate-700">{result.data.title}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Description</h4>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{result.data.description}</p>
                      </div>
                      {result.data.acceptance_criteria?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Acceptance Criteria</h4>
                          <ul className="text-sm text-slate-600 space-y-1">
                            {result.data.acceptance_criteria.map((c, i) => <li key={i}>✓ {c}</li>)}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}