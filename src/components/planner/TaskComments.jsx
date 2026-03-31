import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { Send, Trash2, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TaskComments({ open, onOpenChange, task, user, canComment, teamMembers = [] }) {
  const [comment, setComment] = useState("");
  const [mentions, setMentions] = useState([]);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const queryClient = useQueryClient();

  // Real-time subscription to task comments
  useEffect(() => {
    if (!task?.id) return;
    const unsubscribe = base44.entities.TaskComment.subscribe((event) => {
      if (event.data?.task_id === task.id) {
        queryClient.invalidateQueries({ queryKey: ['task-comments', task.id] });
      }
    });
    return unsubscribe;
  }, [task?.id, queryClient]);

  const { data: comments = [] } = useQuery({
    queryKey: ['task-comments', task?.id],
    queryFn: () => base44.entities.TaskComment.filter({ task_id: task?.id }, 'created_date'),
    enabled: !!task?.id,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (data) => {
      const created = await base44.entities.TaskComment.create({
        task_id: task.id,
        content: data.content,
        author_email: user?.email,
        author_name: user?.full_name,
        mentions: data.mentions
      });
      
      // Create notifications for mentioned users
      if (data.mentions.length > 0) {
        for (const mentionedEmail of data.mentions) {
          await base44.entities.Notification.create({
            user_email: mentionedEmail,
            type: 'task_assigned',
            title: `You were mentioned by ${user?.full_name || user?.email}`,
            message: `In task: ${task.title} - "${data.content.substring(0, 50)}..."`,
            task_id: task.id,
            project_id: task.project_id,
            is_read: false
          });
        }
      }
      
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', task?.id] });
      setComment("");
      setMentions([]);
      setShowMentions(false);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id) => base44.entities.TaskComment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', task?.id] });
    },
  });

  const handleCommentChange = (e) => {
    const text = e.target.value;
    setComment(text);
    
    // Detect @ mentions
    const lastAtIndex = text.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const lastAtContent = text.substring(lastAtIndex + 1);
      if (lastAtContent.includes(' ') || lastAtContent.length === 0) {
        setShowMentions(false);
      } else {
        const suggestions = teamMembers.filter(email => 
          email.toLowerCase().includes(lastAtContent.toLowerCase())
        );
        setMentionSuggestions(suggestions);
        setShowMentions(true);
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionClick = (email) => {
    const lastAtIndex = comment.lastIndexOf('@');
    const beforeAt = comment.substring(0, lastAtIndex);
    setComment(`${beforeAt}@${email.split('@')[0]} `);
    setMentions([...new Set([...mentions, email])]);
    setShowMentions(false);
  };

  const handleSubmit = () => {
    if (!comment.trim()) return;
    addCommentMutation.mutate({ content: comment, mentions });
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
                    <p className="text-sm mt-2 text-slate-700 break-words">
                      {c.content.split(/(@\w+)/g).map((part, idx) => (
                        part.startsWith('@') ? (
                          <span key={idx} className="font-medium text-indigo-600 dark:text-indigo-400">{part}</span>
                        ) : (
                          <span key={idx}>{part}</span>
                        )
                      ))}
                    </p>
                    {c.mentions?.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {c.mentions.map((mention, idx) => (
                          <span key={idx} className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded">
                            @{mention.split('@')[0]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add Comment with @mention support */}
             {canComment && (
               <div className="space-y-2">
                 <div className="relative">
                   <Textarea
                     value={comment}
                     onChange={handleCommentChange}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter' && e.ctrlKey) {
                         handleSubmit();
                       }
                     }}
                     placeholder="Add a comment... Type @ to mention someone"
                     rows={2}
                     className="flex-1"
                   />
                   {/* Mention suggestions */}
                   {showMentions && mentionSuggestions.length > 0 && (
                     <div className="absolute bottom-full left-0 mb-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                       {mentionSuggestions.map((email) => (
                         <button
                           key={email}
                           type="button"
                           onClick={() => handleMentionClick(email)}
                           className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm flex items-center gap-2"
                         >
                           <AtSign className="w-3 h-3 text-indigo-500" />
                           <span>{email}</span>
                         </button>
                       ))}
                     </div>
                   )}
                 </div>
                 <div className="flex gap-2 items-center">
                   <Button onClick={handleSubmit} disabled={!comment.trim()} className="flex-1">
                     <Send className="w-4 h-4 mr-1" /> Send
                   </Button>
                   {mentions.length > 0 && (
                     <span className="text-xs text-slate-500">Mentioning: {mentions.length}</span>
                   )}
                 </div>
               </div>
             )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}