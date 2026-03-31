import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Eye, MessageCircle, Share2, ThumbsUp } from "lucide-react";

const COLORS = ['#6366f1', '#ec4899', '#06b6d4', '#f97316', '#22c55e', '#8b5cf6'];

export default function ContentAnalytics({ performance = [] }) {
  const stats = useMemo(() => {
    const totalViews = performance.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalEngagement = performance.reduce((sum, p) => sum + (p.engagement || 0), 0);
    const totalShares = performance.reduce((sum, p) => sum + (p.shares || 0), 0);
    const totalComments = performance.reduce((sum, p) => sum + (p.comments || 0), 0);
    const avgCTR = performance.length > 0 
      ? (performance.reduce((sum, p) => sum + (p.click_through_rate || 0), 0) / performance.length).toFixed(2)
      : 0;

    return { totalViews, totalEngagement, totalShares, totalComments, avgCTR };
  }, [performance]);

  const byPlatform = useMemo(() => {
    const map = {};
    performance.forEach(p => {
      if (!map[p.platform]) map[p.platform] = { platform: p.platform, views: 0, engagement: 0, count: 0 };
      map[p.platform].views += p.views || 0;
      map[p.platform].engagement += p.engagement || 0;
      map[p.platform].count += 1;
    });
    return Object.values(map);
  }, [performance]);

  const topContent = useMemo(() => {
    return performance.slice().sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
  }, [performance]);

  const sentimentData = useMemo(() => {
    const map = { positive: 0, neutral: 0, negative: 0 };
    performance.forEach(p => {
      map[p.sentiment || 'neutral']++;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [performance]);

  if (performance.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400">No performance data yet. Create and publish content to see analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Views</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalViews.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-pink-600" />
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Engagement</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalEngagement.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-cyan-600" />
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Shares</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalShares.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Comments</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalComments.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Avg CTR</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.avgCTR}%</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Performance by Platform */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Performance by Platform</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byPlatform}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="platform" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Legend />
              <Bar dataKey="views" fill="#6366f1" name="Views" />
              <Bar dataKey="engagement" fill="#ec4899" name="Engagement" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Sentiment */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Audience Sentiment</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RePieChart>
              <Pie data={sentimentData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                <Cell fill="#22c55e" />
                <Cell fill="#f59e0b" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip />
            </RePieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Top Performing Content */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4">Top Performing Content</h3>
        <div className="space-y-3">
          {topContent.map((post, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{post.content_title}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{post.platform}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{post.views?.toLocaleString() || 0} views</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{post.engagement || 0} engagement</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}