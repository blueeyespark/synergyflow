import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Lock, ShieldX, Loader2 } from "lucide-react";

function generateToken(email) {
  // Simple session token stored in memory — cleared on page reload
  return btoa(`${email}:${Date.now()}:vstream-staff`);
}

export default function AITokenGate({ user, onGranted }) {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content: `Hello! 👋 AI Tools are restricted to approved staff only.\n\nTo request access, just ask me to **"grant admin token"** and I'll verify your email against the approved staff list.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);

    // Check if the user is asking for a token
    const wantsToken = text.toLowerCase().includes("grant") || text.toLowerCase().includes("token") || text.toLowerCase().includes("access");

    if (!wantsToken) {
      setMessages(prev => [...prev, {
        role: "ai",
        content: `I can only help with staff access verification here. Ask me to **"grant admin token"** if you'd like to request access to AI Tools.`,
      }]);
      return;
    }

    setLoading(true);
    setMessages(prev => [...prev, { role: "ai", content: "🔍 Checking your email against the approved staff list..." }]);

    try {
      // Check StaffAccess — only admins can read this entity, so non-staff will get an empty array or error
      let staffList = [];
      try {
        staffList = await base44.entities.StaffAccess.filter({ is_active: true });
      } catch {
        staffList = [];
      }

      const isApproved = staffList.some(s => s.email?.toLowerCase() === user?.email?.toLowerCase());
      const isAdmin = user?.role === "admin";

      if (isAdmin || isApproved) {
        const token = generateToken(user.email);
        setMessages(prev => [
          ...prev.slice(0, -1),
          {
            role: "ai",
            content: `✅ **Access granted!** Your email \`${user.email}\` is on the approved staff list.\n\nGenerating your session token...`,
          },
        ]);
        setTimeout(() => {
          onGranted(token);
        }, 1200);
      } else {
        setDenied(true);
        setMessages(prev => [
          ...prev.slice(0, -1),
          {
            role: "ai",
            content: `🚫 **Access denied.** Your email \`${user.email}\` is not on the approved staff list.\n\nPlease ask the platform creator to add you as approved staff.`,
          },
        ]);
      }
    } catch (e) {
      setMessages(prev => [
        ...prev.slice(0, -1),
        {
          role: "ai",
          content: `❌ Something went wrong while verifying your access. Please try again.`,
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#03080f] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1e78ff] to-[#a855f7] flex items-center justify-center">
            {denied ? <ShieldX className="w-5 h-5 text-white" /> : <Lock className="w-5 h-5 text-white" />}
          </div>
          <div>
            <h2 className="text-lg font-black text-[#e8f4ff]">AI Tools — Staff Access</h2>
            <p className="text-xs text-blue-400/50">Restricted to approved staff</p>
          </div>
        </div>

        {/* Chat window */}
        <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl overflow-hidden">
          <div className="h-72 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "ai" && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#1e78ff] to-[#a855f7] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#1e78ff]/20 border border-[#1e78ff]/30 text-[#c8dff5]"
                      : "bg-[#0a1525] border border-blue-900/30 text-[#9fc3e8]"
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, "<strong class='text-[#e8f4ff]'>$1</strong>")
                      .replace(/`(.*?)`/g, "<code class='bg-blue-900/30 px-1 rounded text-[#00c8ff] text-xs'>$1</code>")
                      .replace(/\n/g, "<br/>"),
                  }}
                />
              </motion.div>
            ))}
            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#1e78ff] to-[#a855f7] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-[#0a1525] border border-blue-900/30 rounded-2xl px-3.5 py-2.5">
                  <Loader2 className="w-4 h-4 text-[#1e78ff] animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-blue-900/30 p-3 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder='Type "grant admin token" to request access...'
              disabled={loading || denied}
              className="flex-1 bg-[#0a1525] border border-blue-900/40 rounded-xl px-3 py-2 text-sm text-[#c8dff5] placeholder-blue-400/30 outline-none focus:border-[#1e78ff]/50 transition-colors disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || denied}
              className="w-9 h-9 rounded-xl bg-[#1e78ff] hover:bg-[#3d8fff] disabled:opacity-40 flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}