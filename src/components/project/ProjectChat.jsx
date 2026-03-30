import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, X, MessageSquare, Link2, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function ProjectChat({ projectId, projectName, onClose }) {
  const [user, setUser] = useState(null);
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: messages = [] } = useQuery({
    queryKey: ['chat', projectId],
    queryFn: () => base44.entities.ChatMessage.filter({ project_id: projectId }, 'created_date', 100),
    refetchInterval: 3000,
  });

  // Subscribe to real-time updates
  useEffect(() => {
    const unsub = base44.entities.ChatMessage.subscribe((event) => {
      if (event.data?.project_id === projectId) {
        queryClient.invalidateQueries({ queryKey: ['chat', projectId] });
      }
    });
    return unsub;
  }, [projectId, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (data) => base44.entities.ChatMessage.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat', projectId] }),
  });

  const send = () => {
    if (!input.trim() || !user) return;
    sendMutation.mutate({
      project_id: projectId,
      content: input.trim(),
      sender_email: user.email,
      sender_name: user.full_name || user.email.split('@')[0],
      type: "text",
    });
    setInput("");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    sendMutation.mutate({
      project_id: projectId,
      content: `📎 ${file.name}`,
      sender_email: user.email,
      sender_name: user.full_name || user.email.split('@')[0],
      type: "file",
      file_url,
    });
    setUploading(false);
    e.target.value = "";
  };

  const grouped = messages.reduce((acc, msg) => {
    const key = format(new Date(msg.created_date), 'MMM d, yyyy');
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {});

  const isMe = (msg) => msg.sender_email === user?.email;
  const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const colorFor = (email) => {
    const colors = ['bg-indigo-500', 'bg-pink-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500', 'bg-blue-500'];
    let hash = 0;
    for (let c of (email || '')) hash = c.charCodeAt(0) + hash * 31;
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50">
        <MessageSquare className="w-4 h-4 text-indigo-600" />
        <div className="flex-1">
          <p className="font-semibold text-sm text-slate-900">{projectName}</p>
          <p className="text-xs text-slate-400">{messages.length} messages</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {Object.entries(grouped).map(([date, msgs]) => (
          <div key={date}>
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs text-slate-400 font-medium">{date}</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>
            <div className="space-y-2">
              {msgs.map((msg, i) => {
                const mine = isMe(msg);
                const showAvatar = !mine && (i === 0 || msgs[i-1]?.sender_email !== msg.sender_email);
                return (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                    {!mine && (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-auto ${colorFor(msg.sender_email)} ${!showAvatar ? 'invisible' : ''}`}>
                        {initials(msg.sender_name)}
                      </div>
                    )}
                    <div className={`max-w-[75%] ${mine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                      {showAvatar && !mine && (
                        <span className="text-xs text-slate-400 ml-1">{msg.sender_name}</span>
                      )}
                      <div className={`px-3 py-2 rounded-2xl text-sm ${
                        mine
                          ? 'bg-indigo-600 text-white rounded-br-sm'
                          : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                      }`}>
                        {msg.type === 'file' && msg.file_url ? (
                          <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="underline flex items-center gap-1">
                            <Paperclip className="w-3 h-3" /> {msg.content.replace('📎 ', '')}
                          </a>
                        ) : msg.content}
                      </div>
                      <span className={`text-xs text-slate-400 ${mine ? 'text-right' : ''}`}>
                        {format(new Date(msg.created_date), 'HH:mm')}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-slate-100 flex gap-2">
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
          className="text-slate-400 hover:text-indigo-600 transition-colors p-2 rounded-lg hover:bg-indigo-50">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
        </button>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Message the team..."
          className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50"
        />
        <button onClick={send} disabled={!input.trim() || sendMutation.isPending}
          className="w-9 h-9 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors">
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}