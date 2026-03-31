import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, MessageSquare } from "lucide-react";
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
        <ellipse cx="40" cy="50" rx="7" ry="3" fill="white" opacity="0.9" />
      ) : (
        <path d="M 33 49 Q 40 55 47 49" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.9" />
      )}
    </svg>
  );
}

export default function AIProactivePopup({ tasks = [], projects = [] }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const shownRef = useRef(false);

  const triggerPopup = async () => {
    if (loading || visible) return;
    setLoading(true);
    setVisible(true);

    const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length;
    const prompt = PROACTIVE_PROMPTS[Math.floor(Math.random() * PROACTIVE_PROMPTS.length)];

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Planify AI, a friendly project management assistant. Context: ${projects.length} projects, ${tasks.length} tasks, ${overdue} overdue tasks. ${prompt} Be warm, brief (max 25 words), and address the user directly.`,
    });

    setMessage(typeof result === 'string' ? result : result?.response || "Stay focused — you've got this! 🚀");
    setLoading(false);
  };

  useEffect(() => {
    if (!shownRef.current && tasks.length > 0) {
      // First pop-up after 45 seconds
      const first = setTimeout(() => {
        shownRef.current = true;
        triggerPopup();
      }, 45000);
      return () => clearTimeout(first);
    }
  }, [tasks.length]);

  useEffect(() => {
    // Recurring pop-ups every 8–15 minutes
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
          className="fixed bottom-24 left-4 md:bottom-8 md:left-6 z-50 max-w-xs bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 flex items-center gap-2">
            <div className="w-7 h-7 flex-shrink-0">
              <AvatarFace talking={!loading} />
            </div>
            <p className="text-white text-xs font-semibold flex-1">Planify AI</p>
            <span className="text-indigo-200 text-xs flex items-center gap-1"><Sparkles className="w-3 h-3" /> Just checking in</span>
            <button onClick={() => setVisible(false)} className="text-indigo-200 hover:text-white ml-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-4 py-3">
            {loading ? (
              <div className="flex gap-1 items-center py-1">
                {[0,1,2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
                    animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{message}</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}