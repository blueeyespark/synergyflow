import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Gift, Zap, Shield } from "lucide-react";

const EMOTES = ["😂", "❤️", "🔥", "👏", "😮", "💯", "🎉", "⭐", "😎", "🤣"];
const CHAT_COLORS = ["text-red-400", "text-blue-400", "text-green-400", "text-yellow-400", "text-purple-400", "text-pink-400", "text-cyan-400", "text-orange-400"];

const DEMO_MESSAGES = [
  { id: 1, author: "StreamFan99", content: "let's gooo! 🔥🔥🔥", color: "text-red-400", isSuperChat: false },
  { id: 2, author: "CoolViewer", content: "first time watching, this is amazing!", color: "text-blue-400", isSuperChat: false },
  { id: 3, author: "BigDonor", content: "Love the stream! Keep it up!", color: "text-yellow-400", isSuperChat: true, amount: 5 },
  { id: 4, author: "GameMaster", content: "that move was insane OMEGALUL", color: "text-green-400", isSuperChat: false },
  { id: 5, author: "NightOwl", content: "watching from Tokyo 🇯🇵", color: "text-purple-400", isSuperChat: false },
];

export default function LiveChat({ streamId, user, compact = false }) {
  const [messages, setMessages] = useState(DEMO_MESSAGES);
  const [input, setInput] = useState("");
  const [showEmotes, setShowEmotes] = useState(false);
  const [slowMode, setSlowMode] = useState(false);
  const [superChatAmount, setSuperChatAmount] = useState(null);
  const bottomRef = useRef(null);
  const msgIdRef = useRef(100);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Simulate incoming messages
  useEffect(() => {
    if (!streamId) return;
    const interval = setInterval(() => {
      const authors = ["Viewer123", "StreamLover", "ChatGhost", "NightRaider", "PixelHero"];
      const contents = ["Pog!", "let's go!", "this is fire 🔥", "OMEGALUL", "clip that!", "insane!", "first time here!", "LUL"];
      const color = CHAT_COLORS[Math.floor(Math.random() * CHAT_COLORS.length)];
      setMessages(prev => [
        ...prev.slice(-49),
        {
          id: ++msgIdRef.current,
          author: authors[Math.floor(Math.random() * authors.length)],
          content: contents[Math.floor(Math.random() * contents.length)],
          color,
          isSuperChat: false,
        }
      ]);
    }, 2500);
    return () => clearInterval(interval);
  }, [streamId]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const color = CHAT_COLORS[Math.floor(Math.random() * CHAT_COLORS.length)];
    const newMsg = {
      id: ++msgIdRef.current,
      author: user?.full_name || "You",
      content: input + (superChatAmount ? `` : ""),
      color: "text-cyan-400",
      isSuperChat: !!superChatAmount,
      amount: superChatAmount,
      isOwn: true,
    };
    setMessages(prev => [...prev.slice(-49), newMsg]);
    setInput("");
    setSuperChatAmount(null);
  };

  return (
    <div className={`flex flex-col bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden ${compact ? "h-72" : "h-full"}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white text-xs font-semibold">LIVE CHAT</span>
        </div>
        <div className="flex items-center gap-2">
          {slowMode && <span className="text-xs text-amber-400 flex items-center gap-1"><Shield className="w-3 h-3" /> Slow</span>}
          <button onClick={() => setSlowMode(!slowMode)} className="text-zinc-500 hover:text-white transition-colors">
            <Shield className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
        {messages.map(msg => (
          <div key={msg.id} className={`text-xs leading-relaxed ${msg.isSuperChat ? "bg-yellow-500/20 border border-yellow-500/40 rounded-lg px-2 py-1.5" : ""}`}>
            {msg.isSuperChat && (
              <div className="flex items-center gap-1 mb-0.5">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span className="text-yellow-400 font-bold text-xs">${msg.amount} Super Chat</span>
              </div>
            )}
            <span className={`font-semibold ${msg.color}`}>{msg.author}: </span>
            <span className="text-zinc-300">{msg.content}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Emote picker */}
      {showEmotes && (
        <div className="flex gap-1.5 flex-wrap px-3 py-2 border-t border-zinc-800 bg-zinc-900">
          {EMOTES.map(e => (
            <button key={e} onClick={() => { setInput(prev => prev + e); setShowEmotes(false); }} className="text-lg hover:scale-125 transition-transform">
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Super Chat selector */}
      {superChatAmount !== null && (
        <div className="flex gap-1 px-3 py-2 border-t border-zinc-800 bg-zinc-900">
          {[1, 2, 5, 10, 20, 50].map(amt => (
            <button key={amt} onClick={() => setSuperChatAmount(amt)}
              className={`px-2 py-1 rounded text-xs font-bold transition-colors ${superChatAmount === amt ? "bg-yellow-500 text-black" : "bg-zinc-700 text-white hover:bg-zinc-600"}`}>
              ${amt}
            </button>
          ))}
          <button onClick={() => setSuperChatAmount(null)} className="px-2 py-1 rounded text-xs bg-zinc-700 text-zinc-400 hover:bg-zinc-600 ml-auto">✕</button>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-zinc-800 bg-zinc-900">
        <button onClick={() => { setSuperChatAmount(superChatAmount === null ? 5 : null); setShowEmotes(false); }}
          className={`flex-shrink-0 transition-colors ${superChatAmount !== null ? "text-yellow-400" : "text-zinc-500 hover:text-yellow-400"}`}>
          <Zap className="w-4 h-4" />
        </button>
        <button onClick={() => { setShowEmotes(!showEmotes); setSuperChatAmount(null); }}
          className={`flex-shrink-0 text-lg leading-none ${showEmotes ? "opacity-100" : "opacity-60 hover:opacity-100"}`}>
          😊
        </button>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Send a message..."
          className="flex-1 bg-zinc-800 text-white text-xs rounded-lg px-3 py-1.5 outline-none placeholder:text-zinc-500 border border-zinc-700 focus:border-zinc-500"
        />
        <button onClick={sendMessage} disabled={!input.trim()}
          className="flex-shrink-0 text-white disabled:text-zinc-600 hover:text-cyan-400 transition-colors">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}