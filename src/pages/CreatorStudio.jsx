import { useState } from "react";
import { motion } from "framer-motion";
import { Video, Radio, Image, Calendar, Lightbulb, BarChart3, Youtube, Twitch, DollarSign, FileText, Layout, MessageSquare, Clock, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import VideoEditor from "./VideoEditor";
import ThumbnailMaker from "./ThumbnailMaker";
import IntroOutroMaker from "./IntroOutroMaker";
import ContentIdeas from "./ContentIdeas";
import ContentAnalytics from "./ContentAnalytics";
import YouTubePublisher from "./YouTubePublisher";
import TwitchStreamer from "./TwitchStreamer";
import BudgetPage from "./Budget";
import MediaLibrary from "./MediaLibrary";
import Templates from "./Templates";
import Blog from "./Blog";
import ChannelPage from "./ChannelPage";
import VideoUpload from "./VideoUpload";
import Reports from "./Reports";
import VideoAnalytics from "./VideoAnalytics";
import TimeTrackingAnalytics from "./TimeTrackingAnalytics";
import SocialMedia from "./SocialMedia";

const platformColors = {
  blog: "bg-blue-100 text-blue-700 dark:bg-blue-900/40",
  twitter: "bg-sky-100 text-sky-700 dark:bg-sky-900/40",
  instagram: "bg-pink-100 text-pink-700 dark:bg-pink-900/40",
  linkedin: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40",
  tiktok: "bg-black text-white",
  youtube: "bg-red-100 text-red-700 dark:bg-red-900/40",
};

const tools = [
  { id: "channel", label: "My Channel", icon: Layout, component: ChannelPage },
  { id: "upload", label: "Upload Video", icon: Upload, component: VideoUpload },
  { id: "youtube", label: "YouTube Publisher", icon: Youtube, component: YouTubePublisher },
  { id: "twitch", label: "Twitch Streamer", icon: Twitch, component: TwitchStreamer },
  { id: "editor", label: "Video Editor", icon: Video, component: VideoEditor },
  { id: "thumbnail", label: "Thumbnail Maker", icon: Image, component: ThumbnailMaker },
  { id: "intro", label: "Intro/Outro", icon: Radio, component: IntroOutroMaker },
  { id: "media", label: "Media Library", icon: FileText, component: MediaLibrary },
  { id: "templates", label: "Templates", icon: Layout, component: Templates },
  { id: "blog", label: "Blog", icon: FileText, component: Blog },
  { id: "social", label: "Social Media", icon: MessageSquare, component: SocialMedia },
  { id: "ideas", label: "Content Ideas", icon: Lightbulb, component: ContentIdeas },
  { id: "analytics", label: "Content Analytics", icon: BarChart3, component: ContentAnalytics },
  { id: "video-analytics", label: "Video Analytics", icon: BarChart3, component: VideoAnalytics },
  { id: "reports", label: "Reports", icon: BarChart3, component: Reports },
  { id: "budget", label: "Budget", icon: DollarSign, component: BudgetPage },
  { id: "time-tracking", label: "Time Tracking", icon: Clock, component: TimeTrackingAnalytics },
];

export default function CreatorStudio() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTool, setActiveTool] = useState(null);
  const [contentByDate, setContentByDate] = useState({});

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const ActiveComponent = activeTool ? tools.find(t => t.id === activeTool)?.component : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-4xl font-bold text-slate-900">Creator Studio</h1>
          <p className="text-slate-500 mt-2">Everything you need to create, publish, and grow your content</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3 space-y-6">
            {/* Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-900">
                  {format(currentDate, "MMMM yyyy")}
                </h2>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
                    ← Prev
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                    Today
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>
                    Next →
                  </Button>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="grid grid-cols-7 gap-0 border-b border-slate-200 bg-slate-50">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                  <div key={day} className="p-4 text-center font-semibold text-slate-700">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {days.map((day, idx) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const dayContent = contentByDate[dateStr] || [];
                  const isToday = isSameDay(day, new Date());
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`min-h-32 p-3 border-b border-r border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors ${isToday ? "bg-indigo-50" : ""}`}
                    >
                      <div className={`text-sm font-semibold mb-2 ${isToday ? "text-indigo-600" : "text-slate-600"}`}>
                        {format(day, "d")}
                      </div>
                      <div className="space-y-1">
                        {dayContent.map((post, i) => (
                          <div key={i} className={`text-xs px-2 py-1 rounded truncate font-medium ${platformColors[post.platform] || "bg-slate-100 text-slate-700"}`}>
                            {post.title}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tools Sidebar */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wide px-2">Creator Tools</h3>
            <div className="space-y-1 max-h-[70vh] overflow-y-auto">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      activeTool === tool.id
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg"
                        : "text-slate-700 hover:bg-slate-100 border border-transparent"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs">{tool.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tool Panel Modal */}
      {ActiveComponent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center p-4"
          onClick={() => setActiveTool(null)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto lg:max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{tools.find(t => t.id === activeTool)?.label}</h2>
              <button
                onClick={() => setActiveTool(null)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="p-6">
              <ActiveComponent />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}