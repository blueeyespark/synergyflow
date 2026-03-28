import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Flame, Crown, Medal, Star, Zap, Target } from "lucide-react";
import { BADGES } from "@/components/gamification/useGamification";

export default function Leaderboard() {
  const [user, setUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: allStats = [], isLoading } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => base44.entities.UserStats.list('-total_points', 50),
  });

  const sorted = [...allStats].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
  const myStats = allStats.find(s => s.user_email === user?.email);
  const myRank = sorted.findIndex(s => s.user_email === user?.email) + 1;

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
  const podiumHeights = top3.length >= 3 ? ['h-20', 'h-28', 'h-16'] : ['h-28'];
  const podiumRanks = top3.length >= 3 ? [2, 1, 3] : [1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.5 }}
            className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/30"
          >
            <Trophy className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
          <p className="text-indigo-300 mt-1">Top performers this month</p>
        </motion.div>

        {/* My Stats */}
        {myStats && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-white/10 backdrop-blur rounded-2xl border border-white/20 text-white">
            <p className="text-xs text-indigo-300 mb-2">YOUR STATS</p>
            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                { label: 'Rank', value: `#${myRank || '—'}`, icon: Target },
                { label: 'Points', value: myStats.total_points || 0, icon: Zap },
                { label: 'Streak', value: myStats.streak_days || 0, icon: Flame },
                { label: 'Badges', value: myStats.badges?.length || 0, icon: Medal },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-white/10 rounded-xl p-2">
                  <Icon className="w-4 h-4 mx-auto mb-1 text-indigo-300" />
                  <p className="font-bold text-lg">{value}</p>
                  <p className="text-xs text-indigo-300">{label}</p>
                </div>
              ))}
            </div>
            {myStats.badges?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {myStats.badges.map(b => {
                  const badge = BADGES.find(bd => bd.id === b.id);
                  return badge ? (
                    <motion.span key={b.id} whileHover={{ scale: 1.2 }} title={badge.name}
                      className="text-xl cursor-pointer">{badge.icon}</motion.span>
                  ) : null;
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Podium */}
        {top3.length >= 2 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mb-6 flex items-end justify-center gap-3">
            {podiumOrder.map((stat, i) => {
              if (!stat) return null;
              const rank = podiumRanks[i];
              const isFirst = rank === 1;
              return (
                <div key={stat.id} className="flex flex-col items-center gap-2">
                  {isFirst && (
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                      <Crown className="w-6 h-6 text-amber-400" />
                    </motion.div>
                  )}
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                    isFirst ? 'bg-gradient-to-br from-amber-400 to-orange-500 ring-4 ring-amber-300/50' :
                    rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-400' :
                    'bg-gradient-to-br from-orange-600 to-orange-700'
                  }`}>
                    {(stat.user_name || stat.user_email)?.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-white text-xs font-medium text-center max-w-[70px] truncate">
                    {stat.user_name || stat.user_email?.split('@')[0]}
                  </p>
                  <div className={`${podiumHeights[i]} w-20 rounded-t-xl flex flex-col items-center justify-center gap-1 ${
                    isFirst ? 'bg-gradient-to-t from-amber-500 to-amber-400' :
                    rank === 2 ? 'bg-gradient-to-t from-slate-500 to-slate-400' :
                    'bg-gradient-to-t from-orange-700 to-orange-600'
                  }`}>
                    <span className="text-white font-bold text-lg">#{rank}</span>
                    <span className="text-white/80 text-xs">{stat.total_points || 0}pts</span>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Rankings List */}
        <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/20 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-indigo-300">Loading...</div>
          ) : sorted.length === 0 ? (
            <div className="p-12 text-center">
              <Star className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
              <h3 className="font-medium text-white">No rankings yet</h3>
              <p className="text-sm text-indigo-300">Complete tasks to earn points!</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {sorted.map((stat, index) => {
                const isMe = stat.user_email === user?.email;
                const rank = index + 1;
                return (
                  <motion.div key={stat.id}
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index * 0.04, 0.3) }}
                    onClick={() => setSelectedUser(selectedUser?.id === stat.id ? null : stat)}
                    className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${isMe ? 'bg-indigo-500/20' : 'hover:bg-white/5'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      rank === 1 ? 'bg-amber-400 text-amber-900' :
                      rank === 2 ? 'bg-slate-400 text-slate-900' :
                      rank === 3 ? 'bg-orange-600 text-white' :
                      'bg-white/10 text-indigo-300'
                    }`}>
                      {rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : rank}
                    </div>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${isMe ? 'bg-indigo-500' : 'bg-white/20'}`}>
                      {(stat.user_name || stat.user_email)?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white truncate text-sm">
                          {stat.user_name || stat.user_email?.split('@')[0]}
                        </p>
                        {isMe && <span className="text-xs bg-indigo-500 text-white px-1.5 py-0.5 rounded">You</span>}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-indigo-300">
                        <span>✅ {stat.tasks_completed || 0}</span>
                        <span className="flex items-center gap-0.5"><Flame className="w-3 h-3 text-orange-400" />{stat.streak_days || 0}d</span>
                        <span>{stat.badges?.slice(0, 4).map(b => BADGES.find(bd => bd.id === b.id)?.icon).filter(Boolean).join('')}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{stat.total_points || 0}</p>
                      <p className="text-xs text-indigo-400">pts</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Badge Gallery */}
        <div className="mt-5 bg-white/10 backdrop-blur rounded-2xl border border-white/20 p-4">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><Medal className="w-4 h-4 text-amber-400" />Badge Gallery</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {BADGES.map((badge) => {
              const earned = myStats?.badges?.some(b => b.id === badge.id);
              return (
                <motion.div key={badge.id} whileHover={{ scale: 1.02 }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${earned ? 'bg-amber-500/20 border border-amber-400/30' : 'bg-white/5 opacity-50'}`}>
                  <span className="text-2xl">{badge.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-white">{badge.name}</p>
                    <p className="text-xs text-indigo-300 truncate">{badge.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-amber-400">+{badge.points}</p>
                    {earned && <p className="text-xs text-green-400">✓</p>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}