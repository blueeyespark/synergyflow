import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, Star, Flame, Zap, Medal, Crown } from "lucide-react";
import { BADGES } from "@/components/gamification/useGamification";
import { format } from "date-fns";

const RANK_STYLES = [
  "bg-amber-100 text-amber-700 border-amber-300",
  "bg-slate-100 text-slate-600 border-slate-300",
  "bg-orange-100 text-orange-700 border-orange-300"
];

export default function Leaderboard() {
  const [user, setUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: allStats = [], isLoading } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => base44.entities.UserStats.list('-total_points', 50),
  });

  const sorted = [...allStats].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));

  const myStats = allStats.find(s => s.user_email === user?.email);
  const myRank = sorted.findIndex(s => s.user_email === user?.email) + 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Leaderboard</h1>
          <p className="text-slate-500 mt-1">Team performance & achievements</p>
        </motion.div>

        {/* My Stats Card */}
        {myStats && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-200 text-sm">Your Ranking</p>
                <p className="text-4xl font-bold">#{myRank || '—'}</p>
              </div>
              <div className="text-center">
                <p className="text-indigo-200 text-sm">Points</p>
                <p className="text-4xl font-bold">{myStats.total_points || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-indigo-200 text-sm">Streak</p>
                <div className="flex items-center gap-1 justify-center">
                  <Flame className="w-5 h-5 text-orange-300" />
                  <p className="text-4xl font-bold">{myStats.streak_days || 0}</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-indigo-200 text-sm">Badges</p>
                <p className="text-4xl font-bold">{myStats.badges?.length || 0}</p>
              </div>
            </div>
            {/* My Badges */}
            {myStats.badges?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {myStats.badges.map(b => {
                  const badge = BADGES.find(bd => bd.id === b.id);
                  return badge ? (
                    <span key={b.id} className="text-xl" title={badge.name}>{badge.icon}</span>
                  ) : null;
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Loading...</div>
          ) : sorted.length === 0 ? (
            <div className="p-12 text-center">
              <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-medium text-slate-700">No stats yet</h3>
              <p className="text-sm text-slate-500">Complete tasks to earn points and appear here!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sorted.map((stat, index) => {
                const isMe = stat.user_email === user?.email;
                const rank = index + 1;
                return (
                  <motion.div
                    key={stat.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-4 p-4 ${isMe ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                  >
                    {/* Rank */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border-2 flex-shrink-0 ${rank <= 3 ? RANK_STYLES[rank - 1] : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {rank === 1 ? <Crown className="w-5 h-5" /> : rank}
                    </div>

                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${isMe ? 'bg-indigo-600' : 'bg-slate-400'}`}>
                      {(stat.user_name || stat.user_email)?.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold truncate ${isMe ? 'text-indigo-700' : 'text-slate-900'}`}>
                        {stat.user_name || stat.user_email?.split('@')[0]}
                        {isMe && <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">You</span>}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span>✅ {stat.tasks_completed || 0} tasks</span>
                        <span className="flex items-center gap-0.5"><Flame className="w-3 h-3 text-orange-400" />{stat.streak_days || 0}</span>
                        <div className="flex gap-0.5">
                          {stat.badges?.slice(0, 5).map(b => {
                            const badge = BADGES.find(bd => bd.id === b.id);
                            return badge ? <span key={b.id} className="text-sm">{badge.icon}</span> : null;
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <p className="font-bold text-lg text-slate-900">{stat.total_points || 0}</p>
                      <p className="text-xs text-slate-500">pts</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Badges Legend */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Medal className="w-4 h-4 text-amber-500" />All Badges</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {BADGES.map(badge => {
              const earned = myStats?.badges?.some(b => b.id === badge.id);
              return (
                <div key={badge.id} className={`flex items-center gap-2 p-2 rounded-lg ${earned ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 opacity-60'}`}>
                  <span className="text-2xl">{badge.icon}</span>
                  <div>
                    <p className="font-medium text-sm">{badge.name}</p>
                    <p className="text-xs text-slate-500">{badge.description} · {badge.points}pts</p>
                  </div>
                  {earned && <span className="ml-auto text-green-500 text-xs font-medium">Earned ✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}