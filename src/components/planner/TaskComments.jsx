import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TaskComments({ open, onOpenChange, task, user, canComment }) {
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['task-comments', task?.id],
    queryFn: () => base44.entities.TaskComment.filter({ task_id: task?.id }, 'created_date'),
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

  const deleteCommentMutation = useMutation({
    mutationFn: (id) => base44.entities.TaskComment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', task?.id] });
    },
  });

  const handleSubmit = () => {
    if (!comment.trim()) return;
    addCommentMutation.mutate(comment);
  };

  const priorityColors = {
    low: "bg-blue-100 text-blue-700",
    medium: "bg-amber-100 text-amber-700",
    high: "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{task?.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Task Info */}
          <div className="flex gap-2 flex-wrap">
            <Badge className={priorityColors[task?.priority]}>{task?.priority}</Badge>
            <Badge variant="secondary">{task?.status}</Badge>
            {task?.due_date && (
              <Badge variant="outline">Due: {format(new Date(task.due_date), 'MMM d')}</Badge>
            )}
          </div>

          {task?.description && (
            <p className="text-sm text-slate-600">{task.description}</p>
          )}

          {/* Comments */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Comments ({comments.length})</h4>
            
            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
              {comments.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No comments yet</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-lg group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium text-xs">
                          {c.author_name?.charAt(0) || c.author_email?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{c.author_name || c.author_email}</p>
                          <p className="text-xs text-slate-400">{format(new Date(c.created_date), 'MMM d, HH:mm')}</p>
                        </div>
                      </div>
                      {c.author_email === user?.email && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => deleteCommentMutation.mutate(c.id)}
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm mt-2 text-slate-700">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment */}
            {canComment && (
              <div className="flex gap-2">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={2}
                  className="flex-1"
                />
                <Button onClick={handleSubmit} disabled={!comment.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}