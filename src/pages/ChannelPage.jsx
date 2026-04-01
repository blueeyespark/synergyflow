import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, Share2, Bell, Settings, Play, Upload, Video, MessageSquare } from "lucide-react";
import CommunityPosts from "@/components/CommunityPosts";
import { Link } from "react-router-dom";

export default function ChannelPage() {
  const [user, setUser] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [activeTab, setActiveTab] = useState("videos");

  const currentChannel = selectedChannel || channels[0];

  if (!currentChannel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No Channel Yet</h2>
          <p className="text-slate-600 mb-6">Create your first creator channel to get started</p>
          <Link to="/CreatorStudio">
            <Button>Go to Creator Studio</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Banner */}
      <div className="relative h-48 bg-gradient-to-r from-indigo-500 to-purple-600">
        <img
          src={currentChannel.banner_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=300&fit=crop"}
          alt="Channel banner"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end gap-4 mb-8">
          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg overflow-hidden">
            {currentChannel.avatar_url ? (
              <img src={currentChannel.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              currentChannel.channel_name?.charAt(0)
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">{currentChannel.channel_name}</h1>
            <p className="text-slate-600 flex items-center gap-4 mt-2">
              <span>{currentChannel.subscriber_count || 0} subscribers</span>
              <span>{currentChannel.view_count || 0} views</span>
            </p>
            <p className="text-slate-600 mt-2">{currentChannel.description}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon"><Bell className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon"><Share2 className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon"><Settings className="w-4 h-4" /></Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Views", value: videos.reduce((sum, v) => sum + (v.view_count || 0), 0) },
            { label: "Total Watch Hours", value: Math.round(analytics.reduce((sum, a) => sum + (a.watch_time_hours || 0), 0)) },
            { label: "Videos", value: videos.length },
            { label: "Revenue", value: `$${Math.round(analytics.reduce((sum, a) => sum + (a.revenue || 0), 0))}` },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs text-slate-500 uppercase font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Tab Nav */}
        <div className="flex gap-1 border-b border-slate-200 mb-6">
          {[{id: "videos", label: "Videos", icon: Play}, {id: "community", label: "Community", icon: MessageSquare}].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                activeTab === tab.id ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "videos" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Recent Videos</h2>
              <Link to="/CreatorStudio">
                <Button size="sm" className="gap-2">
                  <Upload className="w-4 h-4" /> Upload Video
                </Button>
              </Link>
            </div>
            {videos.length === 0 ? (
              <div className="text-center py-12">
                <Play className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">No videos yet. Start by uploading your first video!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {videos.map((video) => (
                  <div key={video.id} className="group cursor-pointer">
                    <div className="relative aspect-video bg-slate-200 rounded-lg overflow-hidden mb-2">
                      <img
                        src={video.thumbnail_url || "https://images.unsplash.com/photo-1499750310107-5fef28d66043?w=320&h=180&fit=crop"}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <h3 className="font-medium text-sm text-slate-900 truncate">{video.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{video.view_count || 0} views</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "community" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
            <CommunityPosts />
          </motion.div>
        )}
      </div>
    </div>
  );
}