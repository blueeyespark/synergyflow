import { useState, useEffect } from "react";
import { TrendingUp, Clock, Check, X, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const DEMO_PREDICTIONS = [
  {
    id: 1,
    question: "Will I win this match?",
    outcomes: ["YES, you'll win 🏆", "NO, you're going down 💀"],
    votes: [340, 210],
    bets: [25000, 14000],
    status: "open",
    timeLeft: 120,
  }
];

export default function Predictions({ isStreamer = false }) {
  const [prediction, setPrediction] = useState(DEMO_PREDICTIONS[0]);
  const [userBet, setUserBet] = useState(null);
  const [betAmount, setBetAmount] = useState(100);
  const [result, setResult] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState(["", ""]);

  useEffect(() => {
    if (!prediction || prediction.status !== "open") return;
    const timer = setInterval(() => {
      setPrediction(prev => {
        if (prev.timeLeft <= 1) { clearInterval(timer); return { ...prev, timeLeft: 0, status: "locked" }; }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [prediction?.status]);

  const placeBet = (outcomeIndex) => {
    if (userBet !== null) { toast.error("You already placed a bet!"); return; }
    if (prediction.status !== "open") { toast.error("Predictions are locked!"); return; }
    const newBets = [...prediction.bets];
    newBets[outcomeIndex] += betAmount;
    const newVotes = [...prediction.votes];
    newVotes[outcomeIndex] += 1;
    setPrediction(prev => ({ ...prev, bets: newBets, votes: newVotes }));
    setUserBet(outcomeIndex);
    toast.success(`Bet ${betAmount} points on "${prediction.outcomes[outcomeIndex]}"!`);
  };

  const resolveResult = (winnerIndex) => {
    setResult(winnerIndex);
    setPrediction(prev => ({ ...prev, status: "resolved" }));
    if (userBet === winnerIndex) {
      const totalPool = prediction.bets.reduce((a, b) => a + b, 0) + betAmount;
      const myShare = Math.floor((betAmount / prediction.bets[winnerIndex]) * totalPool * 0.9);
      toast.success(`You won ${myShare} points! 🎉`);
    } else if (userBet !== null) {
      toast.error("Better luck next time!");
    }
  };

  const createPrediction = () => {
    if (!newQuestion.trim() || newOptions.some(o => !o.trim())) return;
    setPrediction({ id: Date.now(), question: newQuestion, outcomes: newOptions, votes: [0, 0], bets: [0, 0], status: "open", timeLeft: 120 });
    setUserBet(null);
    setResult(null);
    setShowCreate(false);
    setNewQuestion("");
    setNewOptions(["", ""]);
  };

  const totalBets = prediction.bets.reduce((a, b) => a + b, 0);
  const minutes = Math.floor((prediction.timeLeft || 0) / 60);
  const seconds = (prediction.timeLeft || 0) % 60;

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <span className="text-white text-sm font-semibold">Predictions</span>
        </div>
        {isStreamer && (
          <button onClick={() => setShowCreate(!showCreate)} className="text-xs text-purple-400 hover:text-purple-300 font-semibold">
            {showCreate ? "Cancel" : "+ New"}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 py-3 border-b border-zinc-800 overflow-hidden">
            <input value={newQuestion} onChange={e => setNewQuestion(e.target.value)} placeholder="Ask a question..." className="w-full bg-zinc-800 text-white text-xs rounded-lg px-3 py-2 outline-none border border-zinc-700 mb-2" />
            {newOptions.map((opt, i) => (
              <input key={i} value={opt} onChange={e => { const o = [...newOptions]; o[i] = e.target.value; setNewOptions(o); }} placeholder={`Option ${i + 1}`} className="w-full bg-zinc-800 text-white text-xs rounded-lg px-3 py-2 outline-none border border-zinc-700 mb-2" />
            ))}
            <button onClick={createPrediction} className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 rounded-lg transition-colors">Start Prediction</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white text-sm font-semibold flex-1">{prediction.question}</p>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            {prediction.status === "open" && <Clock className="w-3 h-3 text-amber-400" />}
            {prediction.status === "open" && (
              <span className="text-amber-400 text-xs font-mono">{minutes}:{String(seconds).padStart(2, "0")}</span>
            )}
            {prediction.status === "locked" && <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded-full font-semibold">LOCKED</span>}
            {prediction.status === "resolved" && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-semibold">ENDED</span>}
          </div>
        </div>

        <div className="space-y-2 mb-3">
          {prediction.outcomes.map((outcome, i) => {
            const pct = totalBets > 0 ? Math.round((prediction.bets[i] / totalBets) * 100) : 50;
            const isWinner = result === i;
            const isLoser = result !== null && result !== i;
            return (
              <button
                key={i}
                onClick={() => placeBet(i)}
                disabled={userBet !== null || prediction.status !== "open"}
                className={`w-full rounded-lg overflow-hidden text-left transition-all ${isWinner ? "ring-2 ring-green-500" : isLoser ? "opacity-50" : userBet === i ? "ring-2 ring-purple-500" : "hover:scale-[1.01]"}`}
              >
                <div className="relative bg-zinc-800 px-3 py-2">
                  <div className={`absolute inset-0 transition-all ${i === 0 ? "bg-blue-600/30" : "bg-red-600/30"}`} style={{ width: `${pct}%` }} />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isWinner && <Trophy className="w-3.5 h-3.5 text-green-400" />}
                      {userBet === i && !isWinner && <Check className="w-3.5 h-3.5 text-purple-400" />}
                      <span className="text-white text-xs font-semibold">{outcome}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white text-xs font-bold">{pct}%</span>
                      <p className="text-zinc-400 text-xs">{prediction.votes[i]} votes</p>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {prediction.status === "open" && userBet === null && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1 flex-1">
              {[50, 100, 500, 1000].map(a => (
                <button key={a} onClick={() => setBetAmount(a)}
                  className={`flex-1 text-xs py-1 rounded transition-colors font-semibold ${betAmount === a ? "bg-purple-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        )}

        {prediction.status === "locked" && isStreamer && (
          <div className="flex gap-2 mt-2">
            {prediction.outcomes.map((o, i) => (
              <button key={i} onClick={() => resolveResult(i)}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-1.5 rounded-lg transition-colors">
                🏆 {o.split(" ")[0]}
              </button>
            ))}
          </div>
        )}

        <p className="text-xs text-zinc-500 mt-2 text-center">{totalBets.toLocaleString()} points in pot</p>
      </div>
    </div>
  );
}