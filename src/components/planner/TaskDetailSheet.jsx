import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  X, Calendar, User, Link2, RefreshCw, MessageSquare, 
  Image, CheckCircle2, Circle, Send, Trash2, Edit2, 
  Clock, Flag, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const priorityColors = {
  low: "bg-blue-100 text-blue-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700"
};

export default function TaskDetailSheet({ 
  open, 
  onOpenChange, 
  task, 
  user, 
  canEdit, 
  canComment,
  onEdit,
  allTasks,
  statuses
}) {
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['task-comments', task?.id],
    queryFn: () => base44.entities.TaskComment.filter({ task_id: task?.id }, 'created_date'),
    enabled: !!task?.id,
  });

  const { data: activityLogs = [] } = useQuery({
    queryKey: ['task-activity', task?.id],
    queryFn: () => base44.entities.ActivityLog.filter({ entity_id: task?.id }, '-created_date', 20),
    enabled: !!task?.id,
  });

  const addCommentMutation = useMutation({
    mutationFn: (content) => base44.entities.TaskComment.create({
      task_id: task.id,
      content,
      author_email: user?.email,
      author_name: user?.full_name
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', task?.id] });
      setComment("");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.update(task.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const toggleStep = (stepId) => {
    if (!canEdit) return;
    const updatedSteps = task.steps.map(s => 
      s.id === stepId ? { ...s, completed: !s.completed } : s
    );
    updateTaskMutation.mutate({ steps: updatedSteps });
  };

  const getStatusName = (statusId) => {
    const status = statuses?.find(s => s.id === statusId);
    return status?.name || statusId;
  };

  const getStatusColor = (statusId) => {
    const status = statuses?.find(s => s.id === statusId);
    return status?.color || '#64748b';
  };

  const getDependencyTasks = () => {
    if (!task?.depends_on?.length || !allTasks) return [];
    return allTasks.filter(t => task.depends_on.includes(t.id));
  };

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-xl">{task.title}</SheetTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge style={{ backgroundColor: getStatusColor(task.status), color: 'white' }}>
                  {getStatusName(task.status)}
                </Badge>
                <Badge className={priorityColors[task.priority]}>
                  <Flag className="w-3 h-3 mr-1" />
                  {task.priority}
                </Badge>
              </div>
            </div>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(task)}>
                <Edit2 className="w-4 h-4 mr-1" /> Edit
              </Button>
            )}
          </div>
        </SheetHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
            <TabsTrigger value="comments" className="flex-1">
              Comments ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-4">
            {/* Description */}
            {task.description && (
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-2">Description</h4>
                <p className="text-slate-700 whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              {task.start_date && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Start Date</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {format(new Date(task.start_date), 'MMM d, yyyy')}
                  </p>
                </div>
              )}
              {task.due_date && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Due Date</p>
                  <p className="font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {format(new Date(task.due_date), 'MMM d, yyyy')}
                  </p>
                </div>
              )}
            </div>

            {/* Assigned To */}
            {task.assigned_to && (
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-2">Assigned To</h4>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-medium">
                    {task.assigned_to.charAt(0).toUpperCase()}
                  </div>
                  <span>{task.assigned_to}</span>
                </div>
              </div>
            )}

            {/* Recurring */}
            {task.recurring?.enabled && (
              <div className="p-3 bg-indigo-50 rounded-lg">
                <h4 className="text-sm font-medium text-indigo-700 mb-1 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Recurring Task
                </h4>
                <p className="text-sm text-indigo-600">
                  Repeats {task.recurring.frequency}
                  {task.recurring.end_date && ` until ${format(new Date(task.recurring.end_date), 'MMM d, yyyy')}`}
                </p>
              </div>
            )}

            {/* Dependencies */}
            {getDependencyTasks().length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
                  <Link2 className="w-4 h-4" /> Dependencies
                </h4>
                <div className="space-y-2">
                  {getDependencyTasks().map(dep => (
                    <div key={dep.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      {dep.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-400" />
                      )}
                      <span className={dep.status === 'completed' ? 'line-through text-slate-400' : ''}>
                        {dep.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Steps/Subtasks */}
            {task.steps?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-2">
                  Subtasks ({task.steps.filter(s => s.completed).length}/{task.steps.length})
                </h4>
                <div className="space-y-2">
                  {task.steps.map(step => (
                    <div 
                      key={step.id} 
                      className={`flex items-center gap-3 p-2 rounded-lg ${canEdit ? 'hover:bg-slate-50 cursor-pointer' : ''}`}
                      onClick={() => canEdit && toggleStep(step.id)}
                    >
                      <Checkbox checked={step.completed} disabled={!canEdit} />
                      <span className={step.completed ? 'line-through text-slate-400' : ''}>
                        {step.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Images */}
            {task.image_urls?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
                  <Image className="w-4 h-4" /> Attachments
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {task.image_urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt="" className="w-full h-24 object-cover rounded-lg hover:opacity-80 transition-opacity" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            {/* Add Comment */}
            {canComment && (
              <div className="mb-4">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <Button 
                    size="sm" 
                    onClick={() => addCommentMutation.mutate(comment)}
                    disabled={!comment.trim()}
                  >
                    <Send className="w-4 h-4 mr-1" /> Send
                  </Button>
                </div>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No comments yet</p>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium text-xs">
                        {c.author_name?.charAt(0) || c.author_email?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{c.author_name || c.author_email}</p>
                        <p className="text-xs text-slate-400">{format(new Date(c.created_date), 'MMM d, HH:mm')}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700">{c.content}</p>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <div className="space-y-3">
              {activityLogs.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No activity yet</p>
              ) : (
                activityLogs.map(log => (
                  <div key={log.id} className="flex gap-3 p-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-medium flex-shrink-0">
                      {log.user_name?.charAt(0) || log.user_email?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{log.user_name || log.user_email}</span>
                        {' '}{log.action.replace('_', ' ')} this task
                      </p>
                      {log.changes && Object.keys(log.changes).length > 0 && (
                        <div className="text-xs text-slate-500 mt-1">
                          {Object.entries(log.changes).map(([field, change]) => (
                            <p key={field}>
                              Changed {field}: {change.from} → {change.to}
                            </p>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        {format(new Date(log.created_date), 'MMM d, HH:mm')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}