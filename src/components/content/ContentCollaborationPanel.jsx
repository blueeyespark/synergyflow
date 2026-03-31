import { useState } from "react";
import { motion } from "framer-motion";
import { Users, MessageSquare, CheckCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ContentCollaborationPanel({ contentId, teamMembers = [] }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [approvals, setApprovals] = useState({});

  const addComment = () => {
    if (!newComment.trim()) return;
    setComments([...comments, {
      id: Date.now(),
      author: "You",
      text: newComment,
      timestamp: new Date().toLocaleTimeString()
    }]);
    setNewComment("");
  };

  const toggleApproval = (member) => {
    setApprovals(prev => ({
      ...prev,
      [member]: !prev[member]
    }));
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
        <Users className="w-5 h-5" />
        Team Collaboration
      </h3>

      {/* Approvals */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Approvals</p>
        <div className="space-y-2">
          {teamMembers.map(member => (
            <motion.div
              key={member}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>{member.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-slate-700 dark:text-slate-300">{member}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleApproval(member)}
                className={approvals[member] ? "text-green-600" : "text-slate-600"}
              >
                <CheckCircle className="w-4 h-4" fill={approvals[member] ? "currentColor" : "none"} />
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Comments */}
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Feedback ({comments.length})
        </p>

        <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
          {comments.map(comment => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3"
            >
              <div className="flex items-start justify-between mb-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{comment.author}</p>
                <p className="text-xs text-slate-500">{comment.timestamp}</p>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">{comment.text}</p>
            </motion.div>
          ))}
        </div>

        {/* Comment Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Add feedback..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addComment()}
            className="text-sm"
          />
          <Button size="sm" onClick={addComment}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}