import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar, Lightbulb, BarChart3, Layout, Users,
  Pen, TrendingUp, Clock, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContentCalendar from "./ContentCalendar";
import ContentIdeas from "./ContentIdeas";
import ContentAnalytics from "./ContentAnalytics";
import ContentTemplates from "./ContentTemplates";

const features = [
  { icon: Calendar, label: "Content Calendar", desc: "Plan & schedule across platforms", color: "from-blue-500 to-cyan-500" },
  { icon: Lightbulb, label: "AI Ideas", desc: "Generate content ideas instantly", color: "from-purple-500 to-pink-500" },
  { icon: BarChart3, label: "Analytics", desc: "Track performance & engagement", color: "from-green-500 to-emerald-500" },
  { icon: Layout, label: "Templates", desc: "Reusable content structures", color: "from-orange-500 to-red-500" },
  { icon: Users, label: "Collaboration", desc: "Team feedback & approvals", color: "from-indigo-500 to-purple-500" }
];

export default function ContentCreator() {
  const [activeTab, setActiveTab] = useState("calendar");

  const { data: blogPosts = [] } = useQuery({
    queryKey: ["blogPosts"],
    queryFn: () => base44.entities.BlogPost.list("-created_date"),
  });

  const { data: socialPosts = [] } = useQuery({
    queryKey: ["socialPosts"],
    queryFn: () => base44.entities.SocialPost.list("-posted_date"),
  });

  const { data: performance = [] } = useQuery({
    queryKey: ["contentPerformance"],
    queryFn: () => base44.entities.ContentPerformance.list("-published_date"),
  });

  const totalContent = blogPosts.length + socialPosts.length;
  const avgEngagement = performance.length > 0 
    ? Math.round(performance.reduce((sum, p) => sum + (p.engagement || 0), 0) / performance.length)
    : 0;
  const topPerforming = performance.sort((a, b) => (b.views || 0) - (a.views || 0))[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white">
              <Pen className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Content Hub</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">Plan, create, and track content across all platforms</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Content</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalContent}</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/40">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Avg Engagement</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{avgEngagement}</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/40">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Top Performing</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white truncate">{topPerforming?.content_title || "—"}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-slate-50 dark:bg-slate-700 rounded-t-2xl border-b border-slate-200 dark:border-slate-600 flex flex-wrap h-auto gap-0 p-0">
              <TabsTrigger value="calendar" className="rounded-none flex-1 data-[state=active]:rounded-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600">
                <Calendar className="w-4 h-4 mr-2" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="ideas" className="rounded-none flex-1 data-[state=active]:rounded-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600">
                <Lightbulb className="w-4 h-4 mr-2" />
                Ideas
              </TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-none flex-1 data-[state=active]:rounded-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="templates" className="rounded-none flex-1 data-[state=active]:rounded-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600">
                <Layout className="w-4 h-4 mr-2" />
                Templates
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="calendar" className="m-0">
                <ContentCalendar blogPosts={blogPosts} socialPosts={socialPosts} />
              </TabsContent>
              <TabsContent value="ideas" className="m-0">
                <ContentIdeas />
              </TabsContent>
              <TabsContent value="analytics" className="m-0">
                <ContentAnalytics performance={performance} />
              </TabsContent>
              <TabsContent value="templates" className="m-0">
                <ContentTemplates />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}