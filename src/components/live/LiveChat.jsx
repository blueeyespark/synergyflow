import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Zap, Shield, SmilePlus } from "lucide-react";

const EMOTES = ["😂", "❤️", "🔥", "👏", "😮", "💯", "🎉", "⭐", "😎", "🤣", "👀", "🙏"];
const CHAT_COLORS = [
  "text-red-400", "text-blue-400", "text-green-400", "text-yellow-400",
  "text-purple-400", "text-pink-400", "text-cyan-400", "text-orange-400"
];

function colorForUser(name) {
  const idx = (name?.charCodeAt(0) || 0) % CHAT_COLORS.length;
  return CHAT_COLORS[idx];
}

export default function LiveChat({ streamId, user, compact = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [showEmotes, setShowEmotes] = useState(false);
  const [slowMode, setSlowMode] = useState(false);
  const [superChatAmount, setSuperChatAmount] = useState(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const lastSentRef = useRef(0);

  // Load initial messages and subscribe to real-time updates
  useEffect(() => {
    if (!streamId) return;

    base44.entities.ChatMessage.filter({ channel: streamId }, "created_date", 50)
      .then(msgs => setMessages(msgs))
      .catch(() => {});

    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      if (event.data?.channel !== streamId) return;
      if (event.type === "create") {
        setMessages(prev => [...prev.slice(-99), event.data]);
      }
    });

    return unsubscribe;
  }, [streamId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    if (slowMode && Date.now() - lastSentRef.current < 3000) return;

    setSending(true);
    lastSentRef.current = Date.now();

    const content = superChatAmount
      ? `💛 $${superChatAmount} Super Chat: ${input.trim()}`
      : input.trim();

    await base44.entities.ChatMessage.create({
      channel: streamId,
      content,
      posted_by: user?.email || "anonymous",
      // Store display name in the message itself
      ...(superChatAmount ? { channel: streamId } : {}),
    });

    setInput("");
    setSuperChatAmount(null);
    setSending(false);
  };

  const isSuperChat = (msg) => msg.content?.startsWith("💛");

  return (
    <div className={`flex flex-col bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden ${compact ? "h-72" : "h-full"}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900/80">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white text-xs font-bold">LIVE CHAT</span>
          <span className="text-zinc-500 text-xs">{messages.length}</span>
        </div>
        <button
          onClick={() => setSlowMode(!slowMode)}
          className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg transition-colors ${slowMode ? "text-amber-400 bg-amber-500/10 border border-amber-500/30" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          <Shield className="w-3 h-3" />
          {slowMode ? "Slow" : "Normal"}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-600 text-xs text-center">No messages yet.<br />Be the first to chat!</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isOwn = msg.posted_by === user?.email;
          const displayName = isOwn ? (user?.full_name || "You") : (msg.posted_by?.split("@")[0] || "Viewer");
          const isSuper = isSuperChat(msg);
          return (
            <div
              key={msg.id || i}
              className={`text-xs leading-relaxed ${isSuper ? "bg-yellow-500/15 border border-yellow-500/30 rounded-lg px-2.5 py-2" : ""}`}
            >
              {isSuper && (
                <div className="flex items-center gap-1 mb-0.5">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  <span className="text-yellow-400 font-bold text-xs">Super Chat</span>
                </div>
              )}
              <span className={`font-semibold ${isOwn ? "text-cyan-400" : colorForUser(msg.posted_by)}`}>
                {displayName}:{" "}
              </span>
              <span className="text-zinc-300">{msg.content}</span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Emote picker */}
      {showEmotes && (
        <div className="flex gap-1.5 flex-wrap px-3 py-2 border-t border-zinc-800 bg-zinc-900/80">
          {EMOTES.map(e => (
            <button key={e} onClick={() => { setInput(prev => prev + e); setShowEmotes(false); }}
              className="text-lg hover:scale-125 transition-transform">
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Super chat selector */}
      {superChatAmount !== null && (
        <div className="flex gap-1 px-3 py-2 border-t border-zinc-800 bg-zinc-900/80 flex-wrap">
          {[1, 2, 5, 10, 20, 50].map(amt => (
            <button key={amt} onClick={() => setSuperChatAmount(amt)}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${superChatAmount === amt ? "bg-yellow-500 text-black" : "bg-zinc-700 text-white hover:bg-zinc-600"}`}>
              ${amt}
            </button>
          ))}
          <button onClick={() => setSuperChatAmount(null)} className="px-2 py-1 rounded-lg text-xs bg-zinc-700 text-zinc-400 hover:bg-zinc-600 ml-auto">✕</button>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-zinc-800 bg-zinc-900/80">
        <button
          onClick={() => { setSuperChatAmount(superChatAmount === null ? 5 : null); setShowEmotes(false); }}
          className={`flex-shrink-0 transition-colors ${superChatAmount !== null ? "text-yellow-400" : "text-zinc-500 hover:text-yellow-400"}`}
        >
          <Zap className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setShowEmotes(!showEmotes); setSuperChatAmount(null); }}
          className={`flex-shrink-0 transition-opacity ${showEmotes ? "opacity-100" : "opacity-50 hover:opacity-100"}`}
        >
          <SmilePlus className="w-4 h-4 text-zinc-400" />
        </button>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder={user ? "Send a message..." : "Log in to chat"}
          disabled={!user}
          className="flex-1 bg-zinc-800 text-white text-xs rounded-lg px-3 py-1.5 outline-none placeholder:text-zinc-500 border border-zinc-700 focus:border-zinc-500 disabled:opacity-50"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || !user || sending}
          className="flex-shrink-0 text-white disabled:text-zinc-600 hover:text-cyan-400 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}