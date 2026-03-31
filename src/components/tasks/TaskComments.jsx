import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { Send, MessageCircle, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function TaskComments({ taskId, teamMembers = [] }) {
  const [input, setInput] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["task_comments", taskId],
    queryFn: () => base44.entities.TaskComment.filter({ task_id: taskId }, "-created_date"),
    enabled: !!taskId,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data) => {
      const comment = await base44.entities.TaskComment.create(data);
      
      // Parse @mentions and send notifications
      const mentions = data.content.match(/@(\w+)/g) || [];
      const mentionedMembers = mentions.map(m => m.slice(1)); // Remove @
      
      for (const member of mentionedMembers) {
        const memberEmail = teamMembers.find(tm => tm.split("@")[0].toLowerCase() === member.toLowerCase());
        if (memberEmail) {
          await base44.entities.Notification.create({
            user_email: memberEmail,
            type: "task_assigned",
            title: "You were mentioned in a comment",
            message: `${user?.full_name} mentioned you: "${data.content.substring(0, 50)}..."`,
            task_id: taskId,
          });
        }
      }
      
      return comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task_comments", taskId] });
      setInput("");
      setReplyingTo(null);
      toast.success("Comment added");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id) => base44.entities.TaskComment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task_comments", taskId] });
      toast.success("Comment deleted");
    },
  });

  const handleSubmit = () => {
    if (!input.trim()) return;
    
    createCommentMutation.mutate({
      task_id: taskId,
      content: input,
      author_email: user?.email,
      author_name: user?.full_name,
      mentions: input.match(/@\w+/g) || [],
    });
  };

  const handleMentionInsert = (email) => {
    const name = email.split("@")[0];
    setInput(input + `@${name} `);
  };

  return (
    <div className="space-y-4 py-4">
      {/* Comment input */}
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
        <div className="flex gap-2 mb-2">
          <button className="text-xs text-slate-500 hover:text-slate-700">
            💬 {comments.length} comments
          </button>
        </div>
        
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a comment... Use @name to mention"
          className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
          rows="3"
        />

        {/* Member mention suggestions */}
        {input.includes("@") && teamMembers.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {teamMembers.map((member) => (
              <button
                key={member}
                onClick={() => handleMentionInsert(member)}
                className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-1 rounded-md hover:bg-indigo-100"
              >
                @{member.split("@")[0]}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-3">
          {replyingTo && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
              className="text-xs"
            >
              Cancel
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!input.trim() || createCommentMutation.isPending}
            className="gap-1"
          >
            <Send className="w-3 h-3" />
            Post
          </Button>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center text-sm text-slate-500">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center text-sm text-slate-500 py-4">No comments yet</div>
        ) : (
          <AnimatePresence>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-slate-100 rounded-lg p-3 hover:border-slate-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-slate-900">{comment.author_name}</span>
                      <span className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mt-1 break-words whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                  {comment.author_email === user?.email && (
                    <button
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}