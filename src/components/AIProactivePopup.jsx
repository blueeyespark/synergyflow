import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

const PROACTIVE_PROMPTS = [
  "Check the user's overdue tasks and give a quick 1-sentence motivational nudge.",
  "Give the user a random productivity tip relevant to project management.",
  "Share a quick insight about their project workload distribution. Keep it to 1 sentence.",
  "Give a random fun fact about productivity or teamwork. One sentence only.",
  "Offer a quick actionable suggestion to help the user stay on track today.",
];

function AvatarFace({ talking }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <defs>
        <radialGradient id="popFaceBg" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#312e81" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="30" fill="url(#popFaceBg)" />
      <ellipse cx="30" cy="34" rx="4" ry="4" fill="white" />
      <ellipse cx="50" cy="34" rx="4" ry="4" fill="white" />
      <circle cx="31" cy="35" r="2" fill="#312e81" />
      <circle cx="51" cy="35" r="2" fill="#312e81" />
      <circle cx="32" cy="33" r="0.8" fill="white" opacity="0.8" />
      <circle cx="52" cy="33" r="0.8" fill="white" opacity="0.8" />
      {talking ? (
        <motion.ellipse cx="40" cy="50" rx="7" ry="3" fill="white" opacity="0.9"
          animate={{ ry: [2, 4, 2] }} transition={{ duration: 0.4, repeat: Infinity }} />
      ) : (
        <path d="M 33 49 Q 40 55 47 49" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.9" />
      )}
    </svg>
  );
}

export default function AIProactivePopup({ tasks = [], projects = [], budget = [] }) {
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyInput, setReplyInput] = useState("");
  const [replying, setReplying] = useState(false);
  const shownRef = useRef(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const triggerPopup = async () => {
    if (loading || visible) return;
    setLoading(true);
    setVisible(true);
    setMessages([]);

    // Smart trigger: prioritize insights based on app health
    const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
    const unassigned = tasks.filter(t => !t.assigned_to).length;
    const blocked = tasks.filter(t => t.depends_on?.length > 0).length;
    const income = budget.filter(b => b.type === 'income').reduce((s, b) => s + (b.amount || 0), 0);
    const expenses = budget.filter(b => b.type === 'expense').reduce((s, b) => s + Math.abs(b.amount || 0), 0);

    let priority = 'standard';
    if (overdue > 0) priority = 'overdue';
    else if (completionRate > 75) priority = 'momentum';
    else if (unassigned > tasks.length * 0.3) priority = 'assignment';

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Planify AI, a friendly yet insightful project management assistant. Be warm, brief (max 35 words), and address the user directly.

Context:
- ${projects.length} projects, ${tasks.length} tasks (${completed} done, ${completionRate}% complete)
- Overdue: ${overdue} | Unassigned: ${unassigned} | Blocked: ${blocked}
- Budget: $${income.toFixed(0)} income, $${expenses.toFixed(0)} expenses
- Priority insight: ${priority === 'overdue' ? 'URGENT - Address overdue tasks!' : priority === 'momentum' ? 'CELEBRATE - Great progress momentum!' : priority === 'assignment' ? 'ORGANIZE - Assign pending tasks' : 'OPTIMIZE - Keep workflow smooth'}

Generate a contextual message matching this priority. Be specific and encouraging.`,
      model: 'gpt_5_mini',
    });

    const msg = typeof result === 'string' ? result : result?.response || "Stay focused — you've got this! 🚀";
    setMessages([{ role: "assistant", content: msg }]);
    setLoading(false);
  };

  const sendReply = async () => {
    const text = replyInput.trim();
    if (!text || replying) return;
    setReplyInput("");
    setReplying(true);

    const updated = [...messages, { role: "user", content: text }];
    setMessages(updated);

    const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
    const assigned = tasks.filter(t => t.assigned_to).length;
    const history = updated.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Planify AI — friendly, sharp, concise, data-aware.

Context: ${projects.length} projects, ${tasks.length} tasks (${completionRate}% done, ${assigned} assigned, ${overdue} overdue).

Conversation:
${history}

Respond naturally in 1-3 sentences max. Reference actual data if relevant. Stay warm and helpful.`,
      model: 'gpt_5_mini',
    });

    const reply = typeof result === 'string' ? result : result?.response || "Happy to help! 😊";
    setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    setReplying(false);
  };

  useEffect(() => {
    if (!shownRef.current && tasks.length > 0) {
      const first = setTimeout(() => {
        shownRef.current = true;
        triggerPopup();
      }, 45000);
      return () => clearTimeout(first);
    }
  }, [tasks.length]);

  useEffect(() => {
    const schedule = () => {
      const delay = (8 + Math.random() * 7) * 60 * 1000;
      return setTimeout(() => {
        triggerPopup();
        timerRef.current = schedule();
      }, delay);
    };
    const timerRef = { current: null };
    timerRef.current = schedule();
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.9 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed bottom-24 left-4 md:bottom-8 md:left-6 z-50 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 flex-shrink-0">
              <AvatarFace talking={replying} />
            </div>
            <p className="text-white text-xs font-semibold flex-1">Planify AI</p>
            <span className="text-indigo-200 text-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Just checking in
            </span>
            <button onClick={() => setVisible(false)} className="text-indigo-200 hover:text-white ml-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 max-h-52">
            {loading ? (
              <div className="flex gap-1 items-center py-1">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
                    animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
                ))}
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-1.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {replying && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-700 rounded-xl px-3 py-1.5 flex gap-1 items-center">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
                      animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, delay: i * 0.12, repeat: Infinity }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Reply input */}
          {!loading && messages.length > 0 && (
            <div className="flex gap-2 px-3 py-2.5 border-t border-slate-100 dark:border-slate-700 flex-shrink-0">
              <input
                value={replyInput}
                onChange={e => setReplyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendReply()}
                placeholder="Reply..."
                disabled={replying}
                className="flex-1 text-xs border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
              <button
                onClick={sendReply}
                disabled={replying || !replyInput.trim()}
                className="w-7 h-7 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg flex items-center justify-center flex-shrink-0"
              >
                {replying ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Send className="w-3 h-3 text-white" />}
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}