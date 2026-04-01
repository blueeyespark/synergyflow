import { useState } from "react";
import { Swords, Users, Zap, Search } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const DEMO_CHANNELS = [
  { id: "1", channel_name: "NightStreamCo", subscriber_count: 12400, is_live: true, category: "Gaming" },
  { id: "2", channel_name: "PixelWizard", subscriber_count: 8900, is_live: true, category: "Art" },
  { id: "3", channel_name: "TechTalker", subscriber_count: 22100, is_live: true, category: "Tech" },
  { id: "4", channel_name: "CozyCook", subscriber_count: 5600, is_live: true, category: "IRL" },
];

export default function RaidWidget({ currentViewers = 0, channels = [] }) {
  const [target, setTarget] = useState(null);
  const [raiding, setRaiding] = useState(false);
  const [raidActive, setRaidActive] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState([]);

  const liveChannels = (channels.length > 0 ? channels : DEMO_CHANNELS).filter(c => c.is_live);
  const filtered = liveChannels.filter(c => c.channel_name?.toLowerCase().includes(search.toLowerCase()));

  const startRaid = (channel) => {
    setTarget(channel);
    setRaiding(true);
    setCountdown(10);
    const flood = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      text: `A raid of ${currentViewers || 150} viewers from your channel! Let's go! 🎉`,
    }));
    setMessages(flood);

    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer);
          setRaiding(false);
          setRaidActive(true);
          toast.success(`Raided ${channel.channel_name} with ${currentViewers || 150} viewers!`);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const cancelRaid = () => {
    setRaiding(false);
    setTarget(null);
    setMessages([]);
    toast.info("Raid cancelled");
  };

  if (raidActive) {
    return (
      <div className="bg-purple-900/30 border border-purple-500/50 rounded-xl p-4 text-center">
        <div className="text-4xl mb-2">🎉</div>
        <p className="text-white font-bold">Successfully Raided!</p>
        <p className="text-purple-300 text-sm">{target?.channel_name} received your raiders</p>
        <button onClick={() => { setRaidActive(false); setTarget(null); }} className="mt-3 text-xs text-purple-400 hover:text-purple-300 underline">
          Raid again
        </button>
      </div>
    );
  }

  if (raiding) {
    return (
      <div className="bg-zinc-900 border border-purple-500/50 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-white" />
            <span className="text-white font-bold text-sm">Raiding {target?.channel_name}</span>
          </div>
          <span className="text-white font-black text-xl">{countdown}</span>
        </div>
        <div className="p-4 space-y-2 max-h-32 overflow-hidden">
          {messages.slice(0, 5).map(m => (
            <p key={m.id} className="text-purple-300 text-xs">{m.text}</p>
          ))}
        </div>
        <div className="px-4 pb-4 flex gap-2">
          <button onClick={cancelRaid} className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold py-2 rounded-lg">Cancel Raid</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
        <Swords className="w-4 h-4 text-purple-400" />
        <span className="text-white text-sm font-semibold">Raid a Channel</span>
        <span className="text-xs text-zinc-500">{currentViewers || 150} raiders ready</span>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2 mb-3 border border-zinc-700">
          <Search className="w-3.5 h-3.5 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search channels..." className="flex-1 bg-transparent text-white text-xs outline-none placeholder:text-zinc-500" />
        </div>
        <div className="space-y-2">
          {filtered.slice(0, 4).map(ch => (
            <div key={ch.id} className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                  {ch.channel_name?.charAt(0)}
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">{ch.channel_name}</p>
                  <p className="text-zinc-400 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block" />
                    LIVE · {ch.category}
                  </p>
                </div>
              </div>
              <button onClick={() => startRaid(ch)}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                <Zap className="w-3 h-3" /> Raid
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}