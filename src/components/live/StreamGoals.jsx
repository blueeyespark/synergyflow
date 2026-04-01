import { useState } from "react";
import { Target, Plus, Edit2, Trash2, Check } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const DEFAULT_GOALS = [
  { id: 1, label: "New Followers", current: 847, target: 1000, unit: "followers", color: "from-cyan-500 to-blue-500" },
  { id: 2, label: "Monthly Subs", current: 23, target: 50, unit: "subs", color: "from-purple-500 to-pink-500" },
];

export default function StreamGoals({ isStreamer = false }) {
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [adding, setAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({ label: "", current: 0, target: 100, unit: "followers", color: "from-cyan-500 to-blue-500" });

  const addGoal = () => {
    if (!newGoal.label.trim()) return;
    setGoals(prev => [...prev, { ...newGoal, id: Date.now() }]);
    setAdding(false);
    setNewGoal({ label: "", current: 0, target: 100, unit: "followers", color: "from-cyan-500 to-blue-500" });
    toast.success("Goal added!");
  };

  const increment = (id) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, current: Math.min(g.current + 1, g.target) } : g));
  };

  const remove = (id) => setGoals(prev => prev.filter(g => g.id !== id));

  const COLORS = [
    "from-cyan-500 to-blue-500",
    "from-purple-500 to-pink-500",
    "from-green-500 to-emerald-500",
    "from-orange-500 to-red-500",
    "from-yellow-500 to-amber-500",
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-green-400" />
          <span className="text-white text-sm font-semibold">Stream Goals</span>
        </div>
        {isStreamer && (
          <button onClick={() => setAdding(!adding)} className="text-xs text-green-400 hover:text-green-300 font-semibold">
            {adding ? "Cancel" : <span className="flex items-center gap-1"><Plus className="w-3 h-3" /> Add</span>}
          </button>
        )}
      </div>

      {adding && (
        <div className="px-4 py-3 border-b border-zinc-800 space-y-2">
          <input value={newGoal.label} onChange={e => setNewGoal(p => ({ ...p, label: e.target.value }))} placeholder="Goal name (e.g. New Followers)" className="w-full bg-zinc-800 text-white text-xs rounded-lg px-3 py-2 outline-none border border-zinc-700" />
          <div className="flex gap-2">
            <input type="number" value={newGoal.current} onChange={e => setNewGoal(p => ({ ...p, current: +e.target.value }))} placeholder="Current" className="flex-1 bg-zinc-800 text-white text-xs rounded-lg px-3 py-2 outline-none border border-zinc-700" />
            <input type="number" value={newGoal.target} onChange={e => setNewGoal(p => ({ ...p, target: +e.target.value }))} placeholder="Target" className="flex-1 bg-zinc-800 text-white text-xs rounded-lg px-3 py-2 outline-none border border-zinc-700" />
          </div>
          <div className="flex gap-1.5">
            {COLORS.map(c => (
              <button key={c} onClick={() => setNewGoal(p => ({ ...p, color: c }))}
                className={`w-6 h-6 rounded-full bg-gradient-to-r ${c} ${newGoal.color === c ? "ring-2 ring-white" : ""}`} />
            ))}
          </div>
          <button onClick={addGoal} className="w-full bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 rounded-lg transition-colors">Add Goal</button>
        </div>
      )}

      <div className="p-4 space-y-4">
        {goals.map(goal => {
          const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
          const done = pct >= 100;
          return (
            <div key={goal.id} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {done && <Check className="w-3.5 h-3.5 text-green-400" />}
                  <span className="text-white text-xs font-semibold">{goal.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 text-xs">{goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}</span>
                  {isStreamer && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => increment(goal.id)} className="text-green-400 hover:text-green-300 text-xs">+1</button>
                      <button onClick={() => remove(goal.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${goal.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-zinc-500 text-xs">{pct}%</span>
                {done && <span className="text-green-400 text-xs font-bold">✓ Goal reached!</span>}
              </div>
            </div>
          );
        })}
        {goals.length === 0 && (
          <p className="text-zinc-500 text-xs text-center py-4">No goals set yet</p>
        )}
      </div>
    </div>
  );
}