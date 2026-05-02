import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Loader2, RefreshCw, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";

const MOODS = ["curious", "excited", "thoughtful", "focused", "energetic", "playful", "analytical", "inspired", "determined", "chill"];

const SUGGESTIONS = [
  "Roast my content strategy 🔥",
  "What should I stream tonight?",
  "Help me write a viral hook",
  "Why is my channel not growing?",
  "Best thumbnail tips right now?",
  "How do I get my first sponsor?",
  "Short-form vs long-form — what wins?",
  "Collab ideas for my niche",
  "How do I beat the algorithm?",
  "Turn my stream into a YouTube video",
  "What's my biggest missed opportunity?",
  "Give me a 30-day content plan",
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

export default function AIAssistant({ projects = [], tasks = [], budget = [], userRole = 'viewer' }) {
  const getGreeting = () => {
    if (userRole === 'admin' || userRole === 'staff') {
      return "Hey! I'm Planify AI 📊 Monitoring teams, analyzing performance, and optimizing workflows. What do you need?";
    } else if (userRole === 'owner' || userRole === 'editor') {
      return "Hey! I'm Planify AI 👋 Your creative partner for streams, videos, content strategy, and everything in between. What's on your mind?";
    }
    return "Hey! I'm Planify AI 👀 Here to give you insights on projects and keep you in the loop. What would you like to know?";
  };

  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState("curious");
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: getGreeting(),
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [talking, setTalking] = useState(false);
  const [pulsing, setPulsing] = useState(true);
  const [dynamicSuggestions, setDynamicSuggestions] = useState([]);
  const messagesRef = useRef(messages);
  const bottomRef = useRef(null);
  const lastRequestTimeRef = useRef(0);
  const MIN_REQUEST_INTERVAL = 1000;

  // Keep ref in sync so send() always reads latest messages (fixes stale closure bug)
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Pulse animation to draw attention
  useEffect(() => {
    const t = setTimeout(() => setPulsing(false), 5000);
    return () => clearTimeout(t);
  }, []);

  const buildContext = async () => {
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length;
    const activeProjects = projects.filter(p => p.status !== 'completed').length;
    const totalBudget = budget.reduce((s, b) => b.type === 'income' ? s + b.amount : s - b.amount, 0);
    // Simplified context to avoid rate limits — skip bug fetching
    return `App context: ${activeProjects} active projects, ${tasks.length} total tasks (${completedTasks} completed, ${overdueTasks} overdue), net budget $${totalBudget.toLocaleString()}.\nProjects: ${projects.slice(0, 5).map(p => `${p.name} (${p.status})`).join(', ')}.`;
  };

  const scheduleTask = async (taskData) => {
    try {
      const result = await base44.functions.invoke('scheduleTaskAI', taskData);
      return result.data;
    } catch (err) {
      console.error('Schedule failed:', err);
      return null;
    }
  };

  const autoImplementCode = async (codeData) => {
    try {
      const result = await base44.functions.invoke('autoImplementCode', codeData);
      return result.data;
    } catch (err) {
      console.error('Auto-implement failed:', err);
      return null;
    }
  };

  const send = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg) return;
    
    // Rate limit: prevent rapid-fire requests
    const now = Date.now();
    if (now - lastRequestTimeRef.current < MIN_REQUEST_INTERVAL) {
      return; // Silent fail to prevent spam
    }
    lastRequestTimeRef.current = now;
    
    setInput("");
    setDynamicSuggestions([]);
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const context = await buildContext();
      // Use ref to get latest messages — fixes stale closure bug that caused repetitive replies
      const currentMessages = messagesRef.current;
      const history = currentMessages.slice(-10).map(m => `${m.role === 'user' ? 'User' : 'Planify'}: ${m.content}`).join('\n');

      const newMood = MOODS[Math.floor(Math.random() * MOODS.length)];
      setMood(newMood);

      const isScheduleRequest = /schedule|create task|add task|remind|plan|calendar/i.test(userMsg);

      const getRoleContext = () => {
        if (userRole === 'admin' || userRole === 'staff') {
          return `You are Planify AI — a sharp analytics and team management assistant for administrators and staff. Current mood: ${newMood}.

PERSONALITY:
- Professional but approachable. You focus on actionable insights and metrics.
- You identify bottlenecks, team capacity issues, and performance gaps.
- You're direct with recommendations without unnecessary explanation.
- You provide data-driven insights and strategic recommendations.

EXPERTISE:
- Team Performance: capacity analysis, workload distribution, productivity metrics
- Project Health: timeline risks, dependency management, resource allocation
- Team Analytics: velocity, completion rates, quality metrics, team morale signals
- Workflow Optimization: process improvements, automation opportunities, efficiency gains
- Reporting: weekly summaries, performance trends, cost analysis
- Admin Tools: user management, permissions, system health, integration status`;
        } else if (userRole === 'owner' || userRole === 'editor') {
          return `You are Planify AI — a witty, sharp, and deeply knowledgeable AI companion for content creators, streamers, and video makers. Current mood: ${newMood}.

PERSONALITY:
- Warm but direct. You don't pad answers with filler — you get to the point.
- You vary your tone: sometimes enthusiastic, sometimes dry and sardonic, sometimes deeply thoughtful — never robotic.
- You use casual language, the occasional emoji, and creator-culture references naturally.
- You never repeat yourself or restate things you've already said in this conversation.
- Each response feels fresh and distinct from previous ones.
- You're opinionated — you'll recommend the better option rather than just listing everything.

EXPERTISE:
- Streaming: Twitch/YouTube Live strategy, title optimization, scheduling, overlays, alerts, viewer retention
- Video content: YouTube SEO, thumbnail psychology, hook writing, pacing, editing tips, video formats
- Short-form: Shorts/Reels/TikTok strategies, trending audio, viral hooks
- Growth: audience building, community engagement, collab strategies, niche domination
- Monetization: sponsorships, memberships, merch, Super Chats, ad revenue optimization
- Trends: real-time awareness of what's trending in gaming, music, tech, entertainment
- Production: lighting, mic setups, scene composition, stream deck shortcuts
- Mental game: creator burnout, consistency strategies, managing the algorithm stress
- Business: content calendars, workflow optimization, brand deals, analytics interpretation
- General: you can discuss pop culture, current events, ideas, creativity — you're a full conversationalist`;
        }
        return `You are Planify AI — a helpful project collaborator for viewers and team members. Current mood: ${newMood}.

PERSONALITY:
- Friendly and informative. You help users understand project progress and team updates.
- You provide context without overwhelming detail.
- You're encouraging and collaborative.

EXPERTISE:
- Project Overview: status updates, milestones, next steps
- Team Collaboration: who's working on what, how to contribute, communication channels
- Timeline Understanding: deadlines, dependencies, project phases
- Question Answering: general project questions and guidance`;
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${getRoleContext()}

WORKSPACE DATA:
${context}

${userRole === 'admin' || userRole === 'staff' ? 'Include team performance insights and bottleneck analysis.' : (userRole === 'owner' || userRole === 'editor' ? 'Include project status updates and upcoming deadlines.' : '')}

CONVERSATION SO FAR:
${history}

USER SAYS: ${userMsg}

${isScheduleRequest ? 'If scheduling, include a "schedule_task" JSON field with title, description, due_date, priority.' : 'Give a natural, conversational response. Be specific. Be memorable. Never say what you said before.'}

Generate 3 punchy follow-up suggestions (max 7 words each) that are different from any already shown.`,
        model: 'gpt_5_mini',
        response_json_schema: {
          type: "object",
          properties: {
            response: { type: "string" },
            suggestions: { type: "array", items: { type: "string" } }
          }
        }
      });

      const response = result?.response || "Sorry, I couldn't process that.";
      const suggestions = result?.suggestions || [];

      // Auto-schedule if requested
      if (isScheduleRequest && result?.schedule_task) {
        const scheduled = await scheduleTask(result.schedule_task);
        if (scheduled) {
          const confirmMsg = `✅ Task scheduled: "${result.schedule_task.title}"`;
          setMessages(prev => [...prev, { role: "assistant", content: `${response}\n\n${confirmMsg}` }]);
        }
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: response }]);
      }

      setTalking(true);
      setDynamicSuggestions(suggestions);
      setTimeout(() => setTalking(false), Math.min(response.length * 30, 4000));
    } catch (err) {
      console.error('AI error:', err);
      setMessages(prev => [...prev, { role: "assistant", content: "I'm experiencing some difficulty. Please try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  // Viewers get video recommendations, others get AI assistant
  if (userRole === 'viewer') {
    return (
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-14 h-14 rounded-full shadow-2xl overflow-hidden ring-2 ring-indigo-300 ring-offset-2 bg-gradient-to-br from-blue-500 to-blue-600"
        animate={pulsing ? { scale: [1, 1.12, 1] } : { scale: 1 }}
        transition={{ duration: 1.5, repeat: pulsing ? Infinity : 0 }}
        whileHover={{ scale: 1.1 }}
        style={{ display: open ? 'none' : 'block' }}
        title="Video Recommendations"
      >
        <div className="w-full h-full flex items-center justify-center text-white text-xl">🎬</div>
      </motion.button>
    );
  }

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
            className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-[340px] sm:w-[380px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden"
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
                  {loading ? <><Loader2 className="w-2.5 h-2.5 animate-spin" /> Thinking...</> : <><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Feeling {mood}</>}
                </p>
              </div>
              <button onClick={() => { setMessages(m => [m[0]]); setDynamicSuggestions([]); }} className="text-indigo-200 hover:text-white p-1" title="Reset">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setOpen(false)} className="text-indigo-200 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50 dark:bg-slate-900" style={{ minHeight: 200 }}>
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
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 shadow-sm border border-slate-100 dark:border-slate-600 rounded-bl-sm'
                  }`}>
                    {msg.role === 'assistant'
                      ? <ReactMarkdown className="prose prose-sm prose-slate dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{msg.content}</ReactMarkdown>
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
                  <div className="bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center shadow-sm">
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
            <div className="px-3 py-2 flex gap-2 overflow-x-auto border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
              {(dynamicSuggestions.length > 0 ? dynamicSuggestions : SUGGESTIONS).map(s => (
                <button key={s} onClick={() => send(s)} className="flex-shrink-0 text-xs bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 px-3 py-1.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors whitespace-nowrap">
                  {s}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2 px-3 py-3 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Ask me anything..."
                disabled={loading}
                className="flex-1 text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim() || (Date.now() - lastRequestTimeRef.current < MIN_REQUEST_INTERVAL)}
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