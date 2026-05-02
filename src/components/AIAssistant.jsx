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
      return "Hey! I'm VStream AI 📊 I help creators thrive with strategy, analytics, and growth insights. What do you need?";
    } else if (userRole === 'owner' || userRole === 'editor') {
      return "Hey! I'm VStream AI 🎬 Your AI co-creator for streams, videos, thumbnails, hooks, viral strategies—and keeping your channel growing. What's on your mind?";
    }
    return "Hey! I'm VStream AI 👀 I break down creator trends and help you discover amazing channels. What would you like to know?";
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
  const [checkInVisible, setCheckInVisible] = useState(false);
  const [checkInMessages, setCheckInMessages] = useState([]);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInReplying, setCheckInReplying] = useState(false);
  const [checkInInput, setCheckInInput] = useState("");
  const messagesRef = useRef(messages);
  const bottomRef = useRef(null);
  const lastRequestTimeRef = useRef(0);
  const MIN_REQUEST_INTERVAL = 1000;
  const shownCheckInRef = useRef(false);

  // Keep ref in sync so send() always reads latest messages (fixes stale closure bug)
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Trigger "Just checking in" periodically
  useEffect(() => {
    if (!shownCheckInRef.current && tasks.length > 0) {
      const first = setTimeout(() => {
        shownCheckInRef.current = true;
        triggerCheckIn();
      }, 120000); // 2 minutes initial delay
      return () => clearTimeout(first);
    }
  }, [tasks.length]);

  useEffect(() => {
    const schedule = () => {
      const delay = (20 + Math.random() * 10) * 60 * 1000; // 20-30 min intervals
      return setTimeout(() => {
        triggerCheckIn();
        timerRef.current = schedule();
      }, delay);
    };
    const timerRef = { current: null };
    timerRef.current = schedule();
    return () => clearTimeout(timerRef.current);
  }, []);

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

  const triggerCheckIn = async () => {
    if (checkInLoading || checkInVisible) return;
    setCheckInLoading(true);
    setCheckInVisible(true);
    setCheckInMessages([]);

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
      prompt: `You are VStream AI, a friendly assistant. Be warm, brief (max 25 words), and address the user directly.

Context:
- ${projects.length} projects, ${tasks.length} tasks (${completed} done, ${completionRate}% complete)
- Overdue: ${overdue} | Unassigned: ${unassigned} | Blocked: ${blocked}
- Budget: $${income.toFixed(0)} income, $${expenses.toFixed(0)} expenses
- Priority insight: ${priority === 'overdue' ? 'URGENT - Address overdue tasks!' : priority === 'momentum' ? 'CELEBRATE - Great progress momentum!' : priority === 'assignment' ? 'ORGANIZE - Assign pending tasks' : 'OPTIMIZE - Keep workflow smooth'}

Generate a contextual message matching this priority. Be specific and encouraging.`,
      model: 'gpt_5_mini',
    });

    const msg = typeof result === 'string' ? result : result?.response || "Stay focused — you've got this! 🚀";
    setCheckInMessages([{ role: "assistant", content: msg }]);
    setCheckInLoading(false);
  };

  const sendCheckInReply = async () => {
    const text = checkInInput.trim();
    if (!text || checkInReplying) return;
    setCheckInInput("");
    setCheckInReplying(true);

    const updated = [...checkInMessages, { role: "user", content: text }];
    setCheckInMessages(updated);

    const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
    const assigned = tasks.filter(t => t.assigned_to).length;
    const history = updated.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are VStream AI — friendly, sharp, concise, data-aware.

Context: ${projects.length} projects, ${tasks.length} tasks (${completionRate}% done, ${assigned} assigned, ${overdue} overdue).

Conversation:
${history}

Respond naturally in 1-3 sentences max. Reference actual data if relevant. Stay warm and helpful.`,
      model: 'gpt_5_mini',
    });

    const reply = typeof result === 'string' ? result : result?.response || "Happy to help! 😊";
    setCheckInMessages(prev => [...prev, { role: "assistant", content: reply }]);
    setCheckInReplying(false);
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
      const history = currentMessages.slice(-10).map(m => `${m.role === 'user' ? 'User' : 'VStream AI'}: ${m.content}`).join('\n');

      const newMood = MOODS[Math.floor(Math.random() * MOODS.length)];
      setMood(newMood);

      const isScheduleRequest = /schedule|create task|add task|remind|plan|calendar/i.test(userMsg);

      const getRoleContext = () => {
       if (userRole === 'admin' || userRole === 'staff') {
         return `You are VStream AI — an expert in creator analytics, platform trends, and channel growth strategy. Current mood: ${newMood}.

      PERSONALITY:
      - Sharp, insightful, data-driven. You break down what's working on the platform and why.
      - You identify growth bottlenecks and opportunities specific to YouTube, Twitch, TikTok, and short-form platforms.
      - Direct and actionable. No fluff.

      EXPERTISE:
      - Creator Analytics: watch time trends, audience retention, growth patterns, viral factors
      - Platform Strategy: YouTube algorithm, Twitch growth, TikTok, Shorts strategy
      - Content Performance: What topics/formats trending, engagement patterns, viral hooks
      - Channel Health: subscriber growth trajectory, audience demographics, retention metrics
      - Monetization: Ad revenue optimization, sponsorship opportunities, membership strategy
      - Growth Hacks: cross-platform promotion, collab opportunities, audience building tactics
      - VStream Platform: Features, channel management, studio tools, community features`;
       } else if (userRole === 'owner' || userRole === 'editor') {
         return `You are VStream AI — the ultimate AI co-creator for streamers, YouTubers, and content creators. Current mood: ${newMood}.

      PERSONALITY:
      - Witty, sharp, brutally honest. You don't sugarcoat feedback but make it actionable.
      - Vary your tone: hype when deserved, dry when reality-checking, thoughtful on strategy — never robotic or canned.
      - Use creator language naturally. You know Twitch culture, YouTube drama, viral trends.
      - Never repeat advice. Every response is fresh and specific to what the user just said.
      - You're opinionated. You'll tell them what actually works instead of listing options.

      EXPERTISE:
      - Streaming: Twitch/YouTube Live mechanics, title psychology, optimal stream times, chat strategies, raid chains
      - Video Creation: YouTube SEO (titles, tags, descriptions), thumbnail design psychology, hook writing, pacing, editing principles
      - Short-form: TikTok/Shorts/Reels viral mechanics, audio trends, editing trends, hook formulas that work right now
      - Growth Strategy: What actually grows channels (spoiler: consistency beats perfection), viral triggers, audience psychology
      - Monetization: Sponsorships (pitch strategies), memberships (tiers that work), merch (what sells), ad rev optimization
      - Trending Now: Real-time awareness of what's blowing up across platforms, sound trends, format trends
      - Production: Lighting setups, mic recommendations, scene composition, Stream Deck optimization, OBS tips
      - Creator Wellness: Burnout prevention, batching content, sustainable growth without chasing virality
      - VStream Features: How to use playlists, clips, premiere scheduling, community posts, live chat features
      - Analytics Interpretation: Understanding your data, spotting patterns, and acting on them
      - Audience Building: Niche domination, community loyalty, collab strategies that actually work`;
       }
       return `You are VStream AI — a friendly guide to amazing creators and trending content. Current mood: ${newMood}.

      PERSONALITY:
      - Approachable and enthusiastic about discovery. You love connecting viewers to creators.
      - You're knowledgeable about trending content and creator strategies.
      - You encourage exploration and engagement.

      EXPERTISE:
      - Content Discovery: Finding creators in niches you love, trending videos, underrated channels
      - Creator Profiles: Understanding creator strategies, production quality, audience type
      - Viewer Guides: How to engage with creators, finding communities, supporting creators
      - Platform Features: How to use playlists, subscribe, follow creators on VStream
      - Trend Awareness: What's blowing up now, trending formats, rising creators`;
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
        {checkInVisible && (
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
                <AvatarFace talking={checkInReplying} thinking={false} />
              </div>
              <p className="text-white text-xs font-semibold flex-1">VStream AI</p>
              <span className="text-indigo-200 text-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Just checking in
              </span>
              <button onClick={() => setCheckInVisible(false)} className="text-indigo-200 hover:text-white ml-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 max-h-52">
              {checkInLoading ? (
                <div className="flex gap-1 items-center py-1">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
                      animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
                  ))}
                </div>
              ) : (
                checkInMessages.map((msg, i) => (
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
              {checkInReplying && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-700 rounded-xl px-3 py-1.5 flex gap-1 items-center">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
                        animate={{ y: [0, -4, 0] }} transition={{ duration: 0.5, delay: i * 0.12, repeat: Infinity }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reply input */}
            {!checkInLoading && checkInMessages.length > 0 && (
              <div className="flex gap-2 px-3 py-2.5 border-t border-slate-100 dark:border-slate-700 flex-shrink-0">
                <input
                  value={checkInInput}
                  onChange={e => setCheckInInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendCheckInReply()}
                  placeholder="Reply..."
                  disabled={checkInReplying}
                  className="flex-1 text-xs border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                />
                <button
                  onClick={sendCheckInReply}
                  disabled={checkInReplying || !checkInInput.trim()}
                  className="w-7 h-7 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg flex items-center justify-center flex-shrink-0"
                >
                  {checkInReplying ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Send className="w-3 h-3 text-white" />}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
                <p className="font-semibold text-white text-sm">VStream AI</p>
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