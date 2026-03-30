import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Loader2, RefreshCw, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";

const SUGGESTIONS = [
  "What tasks are overdue?",
  "Summarize my project health",
  "How is my team performing?",
  "What should I focus on today?",
  "Give me productivity tips",
];

function AvatarFace({ talking, thinking }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* Glow */}
      <defs>
        <radialGradient id="faceGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="faceBg" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#312e81" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="38" fill="url(#faceGlow)" />
      <circle cx="40" cy="40" r="30" fill="url(#faceBg)" />
      {/* Eyes */}
      <motion.ellipse cx="30" cy="34" rx="4" ry={thinking ? 1 : 4} fill="white"
        animate={{ ry: thinking ? [4, 1, 4] : 4 }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }} />
      <motion.ellipse cx="50" cy="34" rx="4" ry={thinking ? 1 : 4} fill="white"
        animate={{ ry: thinking ? [4, 1, 4] : 4 }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }} />
      {/* Pupils */}
      <circle cx="31" cy="35" r="2" fill="#312e81" />
      <circle cx="51" cy="35" r="2" fill="#312e81" />
      {/* Shine */}
      <circle cx="32" cy="33" r="0.8" fill="white" opacity="0.8" />
      <circle cx="52" cy="33" r="0.8" fill="white" opacity="0.8" />
      {/* Mouth */}
      {talking ? (
        <motion.ellipse cx="40" cy="50" rx="7" ry={4} fill="white" opacity="0.9"
          animate={{ ry: [2, 5, 2, 4, 2] }}
          transition={{ duration: 0.4, repeat: Infinity }} />
      ) : (
        <path d="M 33 49 Q 40 55 47 49" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.9" />
      )}
    </svg>
  );
}

export default function AIAssistant({ projects = [], tasks = [], budget = [] }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Hi! I'm Planify AI 👋 I can help you analyze your projects, spot risks, suggest improvements, and answer questions. What would you like to know?",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [talking, setTalking] = useState(false);
  const [pulsing, setPulsing] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Pulse animation to draw attention
  useEffect(() => {
    const t = setTimeout(() => setPulsing(false), 5000);
    return () => clearTimeout(t);
  }, []);

  const buildContext = () => {
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length;
    const activeProjects = projects.filter(p => p.status !== 'completed').length;
    const totalBudget = budget.reduce((s, b) => b.type === 'income' ? s + b.amount : s - b.amount, 0);
    return `App context: ${activeProjects} active projects, ${tasks.length} total tasks (${completedTasks} completed, ${overdueTasks} overdue), net budget $${totalBudget.toLocaleString()}.
Projects: ${projects.slice(0, 5).map(p => `${p.name} (${p.status})`).join(', ')}.`;
  };

  const send = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    const context = buildContext();
    const history = messages.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n');

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Planify AI — a smart, friendly project management assistant. You help users understand their projects, tasks, and productivity.

${context}

Conversation history:
${history}

User: ${userMsg}

Respond concisely and helpfully. Use bullet points or short paragraphs. Be actionable and specific. Keep it under 150 words.`,
    });

    setLoading(false);
    setTalking(true);
    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setTimeout(() => setTalking(false), Math.min(response.length * 30, 4000));
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-14 h-14 rounded-full shadow-2xl overflow-hidden ring-2 ring-indigo-300 ring-offset-2"
        animate={pulsing ? { scale: [1, 1.12, 1] } : { scale: 1 }}
        transition={{ duration: 1.5, repeat: pulsing ? Infinity : 0 }}
        whileHover={{ scale: 1.1 }}
        style={{ display: open ? 'none' : 'block' }}
      >
        <AvatarFace talking={false} thinking={false} />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-[340px] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
            style={{ maxHeight: '520px' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600">
              <div className="w-10 h-10 flex-shrink-0">
                <AvatarFace talking={talking} thinking={loading} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">Planify AI</p>
                <p className="text-xs text-indigo-200 flex items-center gap-1">
                  {loading ? <><Loader2 className="w-2.5 h-2.5 animate-spin" /> Thinking...</> : <><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Online</>}
                </p>
              </div>
              <button onClick={() => setMessages(m => [m[0]])} className="text-indigo-200 hover:text-white p-1" title="Reset">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setOpen(false)} className="text-indigo-200 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50" style={{ minHeight: 200 }}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 flex-shrink-0 rounded-full overflow-hidden bg-indigo-600">
                      <AvatarFace talking={i === messages.length - 1 && talking} thinking={false} />
                    </div>
                  )}
                  <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-bl-sm'
                  }`}>
                    {msg.role === 'assistant'
                      ? <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{msg.content}</ReactMarkdown>
                      : msg.content
                    }
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-indigo-600 flex-shrink-0">
                    <AvatarFace talking={false} thinking={true} />
                  </div>
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center shadow-sm">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
                        animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            {messages.length <= 2 && (
              <div className="px-3 py-2 flex gap-2 overflow-x-auto border-t border-slate-100 bg-white">
                {SUGGESTIONS.slice(0, 3).map(s => (
                  <button key={s} onClick={() => send(s)} className="flex-shrink-0 text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors whitespace-nowrap">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2 px-3 py-3 border-t border-slate-100 bg-white">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Ask me anything..."
                disabled={loading}
                className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50 placeholder:text-slate-400"
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}