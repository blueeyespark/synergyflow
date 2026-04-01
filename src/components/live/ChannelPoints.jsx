import { useState } from "react";
import { Star, Gift, Zap, Music, Smile, ChevronDown, ChevronUp, Check } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_REWARDS = [
  { id: "highlight", icon: "⭐", name: "Highlight My Message", cost: 200, description: "Pin your message in chat for 30 seconds" },
  { id: "emote", icon: "😊", name: "Unlock Random Emote", cost: 500, description: "Use a special channel emote for this session" },
  { id: "pick_song", icon: "🎵", name: "Pick Next Song", cost: 1000, description: "Choose the background music for the next round" },
  { id: "choose_game", icon: "🎮", name: "Choose Next Game", cost: 2500, description: "Pick which game the streamer plays next" },
  { id: "dance", icon: "🕺", name: "Make Me Dance", cost: 5000, description: "Streamer does a victory dance on camera" },
];

export default function ChannelPoints({ channelId }) {
  const [points, setPoints] = useState(() => parseInt(localStorage.getItem(`points_${channelId}`) || "1250"));
  const [redeemed, setRedeemed] = useState({});
  const [expanded, setExpanded] = useState(true);

  const earnPoints = () => {
    const earned = Math.floor(Math.random() * 50) + 10;
    const newPoints = points + earned;
    setPoints(newPoints);
    localStorage.setItem(`points_${channelId}`, newPoints);
    toast.success(`+${earned} Channel Points earned!`);
  };

  const redeemReward = (reward) => {
    if (points < reward.cost) {
      toast.error("Not enough points!");
      return;
    }
    if (redeemed[reward.id]) {
      toast.error("Already redeemed this reward!");
      return;
    }
    const newPoints = points - reward.cost;
    setPoints(newPoints);
    localStorage.setItem(`points_${channelId}`, newPoints);
    setRedeemed(prev => ({ ...prev, [reward.id]: true }));
    toast.success(`Redeemed: ${reward.name}!`);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400" />
          <span className="text-white text-sm font-semibold">Channel Points</span>
          <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full">{points.toLocaleString()}</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <button
            onClick={earnPoints}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold px-3 py-2 rounded-lg mb-3 transition-colors flex items-center justify-center gap-2"
          >
            <Zap className="w-3.5 h-3.5" /> Claim Daily Bonus
          </button>
          <div className="space-y-2">
            {DEFAULT_REWARDS.map(reward => (
              <div key={reward.id} className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg flex-shrink-0">{reward.icon}</span>
                  <div className="min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{reward.name}</p>
                    <p className="text-zinc-400 text-xs truncate">{reward.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => redeemReward(reward)}
                  disabled={points < reward.cost || redeemed[reward.id]}
                  className={`flex-shrink-0 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${
                    redeemed[reward.id]
                      ? "bg-green-500/20 text-green-400"
                      : points >= reward.cost
                      ? "bg-yellow-500 text-black hover:bg-yellow-400"
                      : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                  }`}
                >
                  {redeemed[reward.id] ? <><Check className="w-3 h-3" /> Done</> : <><Star className="w-3 h-3" /> {reward.cost.toLocaleString()}</>}
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-3 text-center">Watch to earn more points automatically</p>
        </div>
      )}
    </div>
  );
}