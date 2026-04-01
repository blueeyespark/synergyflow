import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, Radio, Image, Calendar, Lightbulb, BarChart3, Youtube, Twitch, DollarSign, FileText, Layout, MessageSquare, Clock, Users, Settings, Upload, LayoutDashboard } from "lucide-react";
import VideoEditor from "./VideoEditor";
import ThumbnailMaker from "./ThumbnailMaker";
import IntroOutroMaker from "./IntroOutroMaker";
import ContentCalendar from "./ContentCalendar";
import ContentIdeas from "./ContentIdeas";
import ContentAnalytics from "./ContentAnalytics";
import YouTubePublisher from "./YouTubePublisher";
import TwitchStreamer from "./TwitchStreamer";
import CalendarPage from "./Calendar";
import BudgetPage from "./Budget";
import MediaLibrary from "./MediaLibrary";
import Templates from "./Templates";
import Blog from "./Blog";
import ChannelPage from "./ChannelPage";
import VideoUpload from "./VideoUpload";
import Reports from "./Reports";
import VideoAnalytics from "./VideoAnalytics";
import TimeTrackingAnalytics from "./TimeTrackingAnalytics";
import Meetings from "./Meetings";
import Planner from "./Planner";
import SocialMedia from "./SocialMedia";

import Dashboard from "./Dashboard";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, component: Dashboard },
  { id: "channel", label: "My Channel", icon: Users, component: ChannelPage },
  { id: "upload", label: "Upload Video", icon: Upload, component: VideoUpload },
  { id: "youtube", label: "YouTube Publisher", icon: Youtube, component: YouTubePublisher },
  { id: "twitch", label: "Twitch Streamer", icon: Twitch, component: TwitchStreamer },
  { id: "editor", label: "Video Editor", icon: Video, component: VideoEditor },
  { id: "thumbnail", label: "Thumbnail Maker", icon: Image, component: ThumbnailMaker },
  { id: "intro", label: "Intro/Outro", icon: Radio, component: IntroOutroMaker },
  { id: "media", label: "Media Library", icon: Image, component: MediaLibrary },
  { id: "templates", label: "Templates", icon: Layout, component: Templates },
  { id: "blog", label: "Blog", icon: FileText, component: Blog },
  { id: "social", label: "Social Media", icon: MessageSquare, component: SocialMedia },
  { id: "content-calendar", label: "Content Calendar", icon: Calendar, component: ContentCalendar },
  { id: "ideas", label: "Content Ideas", icon: Lightbulb, component: ContentIdeas },
  { id: "analytics", label: "Content Analytics", icon: BarChart3, component: ContentAnalytics },
  { id: "video-analytics", label: "Video Analytics", icon: BarChart3, component: VideoAnalytics },
  { id: "reports", label: "Reports", icon: BarChart3, component: Reports },
  { id: "schedule", label: "Schedule", icon: Calendar, component: CalendarPage },
  { id: "meetings", label: "Meetings", icon: Users, component: Meetings },
  { id: "planner", label: "Planner", icon: Settings, component: Planner },
  { id: "time-tracking", label: "Time Tracking", icon: Clock, component: TimeTrackingAnalytics },
  { id: "budget", label: "Budget", icon: DollarSign, component: BudgetPage },

];

export default function CreatorStudio() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold text-slate-900">Creator Studio</h1>
          <p className="text-slate-500 mt-2">Everything you need to create, publish, and grow your content</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto">
              <TabsList className="inline-flex w-full gap-1 p-4 bg-slate-50 rounded-t-2xl border-b border-slate-200">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center gap-1.5 text-xs sm:text-sm font-medium px-2 sm:px-3 py-2 rounded-lg transition-colors data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white whitespace-nowrap"
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <div className="p-6">
              {ActiveComponent && <ActiveComponent />}
            </div>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}