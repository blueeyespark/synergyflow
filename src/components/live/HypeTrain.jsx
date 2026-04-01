import { useState, useEffect } from "react";
import { Zap, Train, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LEVELS = [
  { level: 1, threshold: 100, reward: "Train Started! 🚂", color: "from-yellow-500 to-orange-500" },
  { level: 2, threshold: 300, reward: "Level 2! Extra emotes unlocked 🎉", color: "from-orange-500 to-red-500" },
  { level: 3, threshold: 600, reward: "Level 3! Custom overlay activated 🔥", color: "from-red-500 to-pink-500" },
  { level: 4, threshold: 1000, reward: "Level 4! Streamer unlocked secret cam! 👀", color: "from-pink-500 to-purple-500" },
  { level: 5, threshold: 1500, reward: "MAX HYPE! Legendary reward! 🏆", color: "from-purple-500 to-indigo-500" },
];

export default function HypeTrain({ onContribute }) {
  const [hype, setHype] = useState(0);
  const [active, setActive] = useState(false);
  const [level, setLevel] = useState(0);
  const [showReward, setShowReward] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 min

  const currentLevel = LEVELS.findLast(l => hype >= l.threshold) || null;
  const nextLevel = LEVELS.find(l => hype < l.threshold) || LEVELS[LEVELS.length - 1];
  const progress = currentLevel
    ? Math.min(100, ((hype - currentLevel.threshold) / ((nextLevel?.threshold || currentLevel.threshold + 500) - currentLevel.threshold)) * 100)
    : Math.min(100, (hype / LEVELS[0].threshold) * 100);

  useEffect(() => {
    if (!active) return;
    if (timeLeft <= 0) {
      setActive(false);
      setHype(0);
      setLevel(0);
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [active, timeLeft]);

  const contribute = (amount) => {
    const newHype = hype + amount;
    setHype(newHype);
    if (!active) { setActive(true); setTimeLeft(300); }

    const newLevel = LEVELS.findLast(l => newHype >= l.threshold);
    if (newLevel && newLevel.level > level) {
      setLevel(newLevel.level);
      setShowReward(newLevel.reward);
      setTimeout(() => setShowReward(null), 3000);
    }
    onContribute?.(amount);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (!active && hype === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Train className="w-4 h-4 text-yellow-400" />
          <span className="text-white text-sm font-semibold">Hype Train</span>
          <span className="text-xs text-zinc-500">Trigger by supporting the stream!</span>
        </div>
        <div className="flex gap-2">
          {[50, 100, 200, 500].map(amt => (
            <button key={amt} onClick={() => contribute(amt)}
              className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-400 text-xs font-bold py-2 rounded-lg transition-colors">
              +{amt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-gradient-to-r ${currentLevel?.color || "from-yellow-500 to-orange-500"} p-0.5 rounded-xl overflow-hidden`}>
      <div className="bg-zinc-950 rounded-[11px] p-4">
        {/* Level reward popup */}
        <AnimatePresence>
          {showReward && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-x-4 top-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold text-sm rounded-lg px-3 py-2 text-center z-10"
            >
              {showReward}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.div animate={{ x: [0, 3, -3, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>
              <Train className="w-5 h-5 text-yellow-400" />
            </motion.div>
            <span className="text-white font-bold text-sm">
              HYPE TRAIN {currentLevel ? `LEVEL ${currentLevel.level}` : "STARTING"}
            </span>
          </div>
          <span className="text-xs text-zinc-400">{minutes}:{String(seconds).padStart(2, "0")}</span>
        </div>

        {/* Progress bar */}
        <div className="bg-zinc-800 rounded-full h-3 mb-3 overflow-hidden">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${currentLevel?.color || "from-yellow-500 to-orange-500"}`}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-zinc-400">{hype} / {nextLevel.threshold} hype</span>
          <div className="flex gap-1">
            {LEVELS.map(l => (
              <div key={l.level} className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${l.level <= (currentLevel?.level || 0) ? "bg-yellow-500 text-black" : "bg-zinc-700 text-zinc-500"}`}>
                {l.level}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {[50, 100, 200, 500].map(amt => (
            <button key={amt} onClick={() => contribute(amt)}
              className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1">
              <Zap className="w-3 h-3" /> +{amt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}