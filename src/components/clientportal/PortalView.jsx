import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, MessageSquare, ThumbsUp, ThumbsDown, X, Send, Globe } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function PortalView({ portal, onClose, isPreview = false }) {
  const [commenterName, setCommenterName] = useState('');
  const [commenterEmail, setCommenterEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['portal-tasks', portal.project_id],
    queryFn: () => base44.entities.Task.filter({ project_id: portal.project_id }),
    enabled: !!portal.project_id,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['portal-comments', portal.id],
    queryFn: () => base44.entities.ClientComment.filter({ portal_id: portal.id }, '-created_date'),
  });

  const commentMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientComment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-comments', portal.id] });
      queryClient.invalidateQueries({ queryKey: ['client-comments'] });
      setCommentText('');
      toast.success('Comment posted!');
    },
  });

  const approvalMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ClientComment.update(id, { approval_status: status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portal-comments', portal.id] }),
  });

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const progress = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const deliverables = tasks.filter(t => ['high', 'urgent'].includes(t.priority));

  const submitComment = (isApproval = false) => {
    if (!commentText || (!isPreview && !commenterName)) return;
    commentMutation.mutate({
      portal_id: portal.id,
      project_id: portal.project_id,
      content: commentText,
      author_name: isPreview ? 'Preview User' : commenterName,
      author_email: isPreview ? 'preview@test.com' : commenterEmail,
      is_approval: isApproval,
      approval_status: isApproval ? 'pending' : undefined,
    });
  };

  const sections = portal.shared_sections || ['progress', 'deliverables'];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="p-6 text-white relative" style={{ backgroundColor: portal.branding_color || '#6366f1' }}>
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5 opacity-80" />
            <span className="text-sm opacity-80">Client Portal</span>
            {isPreview && <Badge className="bg-white/20 text-white text-xs">Preview Mode</Badge>}
          </div>
          <h1 className="text-2xl font-bold">{portal.title}</h1>
          {portal.description && <p className="text-sm opacity-80 mt-1">{portal.description}</p>}
          {portal.project_name && <p className="text-xs opacity-60 mt-2">Project: {portal.project_name}</p>}
        </div>

        <div className="p-6 space-y-6">
          {/* Progress */}
          {sections.includes('progress') && (
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" /> Overall Progress
              </h2>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">{completedTasks.length} of {tasks.length} tasks complete</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { label: 'To Do', count: tasks.filter(t => t.status === 'todo').length, color: 'text-slate-500' },
                    { label: 'In Progress', count: tasks.filter(t => t.status === 'in_progress').length, color: 'text-blue-500' },
                    { label: 'Done', count: completedTasks.length, color: 'text-green-500' },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                      <p className="text-xs text-slate-400">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          {sections.includes('timeline') && tasks.filter(t => t.due_date).length > 0 && (
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" /> Timeline
              </h2>
              <div className="space-y-2">
                {tasks.filter(t => t.due_date).sort((a,b) => new Date(a.due_date) - new Date(b.due_date)).slice(0, 6).map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.status === 'completed' ? 'bg-green-500' : task.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                    <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">{task.title}</span>
                    <span className="text-xs text-slate-400">{format(new Date(task.due_date), 'MMM d')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deliverables */}
          {sections.includes('deliverables') && deliverables.length > 0 && (
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">🎯 Key Deliverables</h2>
              <div className="space-y-2">
                {deliverables.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    {task.status === 'completed'
                      ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      : <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />}
                    <span className={`text-sm flex-1 ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>{task.title}</span>
                    <Badge className={task.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'} variant="secondary">
                      {task.status?.replace('_', ' ')}
                    </Badge>
                    {portal.allow_approvals && task.status === 'completed' && (
                      <div className="flex gap-1">
                        <button className="text-green-500 hover:text-green-700 p-1" title="Approve" onClick={() => toast.success('Approved!')}>
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button className="text-red-400 hover:text-red-600 p-1" title="Request revision" onClick={() => toast.info('Revision requested')}>
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          {portal.allow_comments && (
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-500" /> Comments & Feedback
              </h2>
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No comments yet. Be the first to leave feedback!</p>
                ) : comments.map(c => (
                  <div key={c.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-slate-800 dark:text-slate-200">{c.author_name}</span>
                      {c.is_approval && (
                        <Badge className={c.approval_status === 'approved' ? 'bg-green-100 text-green-700' : c.approval_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                          {c.approval_status}
                        </Badge>
                      )}
                      <span className="text-xs text-slate-400 ml-auto">{format(new Date(c.created_date), 'MMM d')}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{c.content}</p>
                  </div>
                ))}
              </div>
              {!isPreview && (
                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Your name *" value={commenterName} onChange={e => setCommenterName(e.target.value)} />
                    <Input placeholder="Email (optional)" value={commenterEmail} onChange={e => setCommenterEmail(e.target.value)} />
                  </div>
                  <Textarea placeholder="Leave a comment or feedback..." value={commentText} onChange={e => setCommentText(e.target.value)} rows={2} />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => submitComment(false)} disabled={!commentText || !commenterName || commentMutation.isPending}>
                      <Send className="w-3 h-3 mr-1.5" /> Comment
                    </Button>
                    {portal.allow_approvals && (
                      <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => submitComment(true)} disabled={!commentText || !commenterName || commentMutation.isPending}>
                        <ThumbsUp className="w-3 h-3 mr-1.5" /> Approve & Comment
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}