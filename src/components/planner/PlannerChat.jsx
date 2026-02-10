import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { X, Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PlannerChat({ plannerId, user, onClose }) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages', plannerId],
    queryFn: () => base44.entities.ChatMessage.filter({ planner_id: plannerId }, 'created_date'),
    refetchInterval: 3000,
  });

  // Subscribe to real-time messages
  useEffect(() => {
    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      if (event.data?.planner_id === plannerId) {
        queryClient.invalidateQueries({ queryKey: ['chat-messages', plannerId] });
      }
    });
    return unsubscribe;
  }, [plannerId, queryClient]);

  const sendMutation = useMutation({
    mutationFn: (content) => base44.entities.ChatMessage.create({
      planner_id: plannerId,
      content,
      sender_email: user?.email,
      sender_name: user?.full_name,
      type: 'text'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', plannerId] });
      setMessage("");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendMutation.mutate(message);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-semibold">Chat</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_email === user?.email ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  msg.sender_email === user?.email
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-900'
                }`}
              >
                {msg.sender_email !== user?.email && (
                  <p className="text-xs font-medium mb-1 opacity-70">{msg.sender_name || msg.sender_email}</p>
                )}
                <p className="text-sm">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.sender_email === user?.email ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {format(new Date(msg.created_date), 'HH:mm')}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!message.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}