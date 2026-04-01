import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bell, Share2, Settings, Play, ThumbsUp, Users, Eye, MessageSquare, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import CommunityPosts from "@/components/CommunityPosts";
import VideoPlayerModal from "@/components/dashboard/VideoPlayerModal";

function formatCount(n) {
  if (!n) return "0";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function ChannelPage() {
  const [user, setUser] = useState(null);
  const [subscribed, setSubscribed] = useState(false);
  const [notified, setNotified] = useState(false);
  const [activeTab, setActiveTab] = useState("videos");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const channelId = urlParams.get("id");

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: channels = [] } = useQuery({
    queryKey: ["channels-all"],
    queryFn: () => base44.entities.Channel.list(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: videos = [] } = useQuery({
    queryKey: ["videos-all"],
    queryFn: () => base44.entities.Video.list("-created_date", 60),
    staleTime: 5 * 60 * 1000,
  });

  // Determine channel: if id param given use that, else find user's own channel
  const channel = channelId
    ? channels.find(c => c.id === channelId)
    : channels.find(c => c.creator_email === user?.email);

  const isOwnChannel = channel && user && channel.creator_email === user.email;

  const channelVideos = videos.filter(
    v => v.channel_id === channel?.id && v.status !== "deleted"
  );

  const channelMap = channels.reduce((acc, c) => { acc[c.id] = c; return acc; }, {});

  if (!user && !channelId) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <Users className="w-14 h-14 text-gray-300 dark:text-zinc-700 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {isOwnChannel === false ? "Channel not found" : "No channel yet"}
          </h2>
          <p className="text-gray-500 dark:text-zinc-400 mb-6">
            {isOwnChannel === false
              ? "This channel doesn't exist."
              : "Create your channel in Creator Studio to get started."}
          </p>
          {!channelId && (
            <Link to="/CreatorStudio">
              <Button>Go to Creator Studio</Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-white">
      {/* Banner */}
      <div className="relative h-44 md:h-56 bg-gradient-to-r from-indigo-600 to-purple-600 overflow-hidden">
        {channel.banner_url && (
          <img src={channel.banner_url} alt="Banner" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Channel header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-6">
          {/* Avatar */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-4 border-white dark:border-zinc-950 flex items-center justify-center text-white text-3xl font-bold overflow-hidden flex-shrink-0 shadow-lg">
            {channel.avatar_url
              ? <img src={channel.avatar_url} alt="" className="w-full h-full object-cover" />
              : channel.channel_name?.charAt(0)
            }
          </div>

          {/* Info + Actions */}
          <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold">{channel.channel_name}</h1>
                {channel.is_verified && <span className="text-blue-500 text-lg">✓</span>}
              </div>
              <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">
                {formatCount(channel.subscriber_count)} subscribers · {channelVideos.length} videos
              </p>
              {channel.description && (
                <p className="text-gray-600 dark:text-zinc-400 text-sm mt-1 max-w-xl line-clamp-2">{channel.description}</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isOwnChannel ? (
                <Link to="/CreatorStudio">
                  <Button className="gap-2">
                    <Edit3 className="w-4 h-4" /> Edit Channel / Creator Studio
                  </Button>
                </Link>
              ) : (
                <>
                  <Button
                    onClick={() => setSubscribed(!subscribed)}
                    variant={subscribed ? "outline" : "default"}
                    className="gap-2"
                  >
                    {subscribed ? "Subscribed" : "Subscribe"}
                  </Button>
                  {subscribed && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setNotified(!notified)}
                      className={notified ? "text-blue-600 border-blue-400" : ""}
                    >
                      <Bell className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="outline" size="icon">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Eye, label: "Total Views", value: formatCount(channel.view_count || channelVideos.reduce((s, v) => s + (v.view_count || 0), 0)) },
            { icon: Users, label: "Subscribers", value: formatCount(channel.subscriber_count) },
            { icon: Play, label: "Videos", value: channelVideos.length },
          ].map((s, i) => (
            <div key={i} className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-3 text-center">
              <s.icon className="w-4 h-4 text-gray-400 dark:text-zinc-500 mx-auto mb-1" />
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-zinc-800 mb-6">
          {[
            { id: "videos", label: "Videos", icon: Play },
            { id: "community", label: "Community", icon: MessageSquare },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
              }`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Videos tab */}
        {activeTab === "videos" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12">
            {channelVideos.length === 0 ? (
              <div className="text-center py-16">
                <Play className="w-12 h-12 text-gray-300 dark:text-zinc-700 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-zinc-400">No videos yet</p>
                {isOwnChannel && (
                  <Link to="/CreatorStudio">
                    <Button className="mt-4">Upload your first video</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {channelVideos.map((video, i) => (
                  <motion.div key={video.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="group cursor-pointer" onClick={() => setSelectedVideo(video)}>
                    <div className="relative aspect-video bg-gray-200 dark:bg-zinc-800 rounded-xl overflow-hidden mb-2">
                      <img
                        src={video.thumbnail_url || `https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=225&fit=crop&sig=${video.id}`}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-2">
                          <div className="w-0 h-0 border-t-[8px] border-b-[8px] border-l-[14px] border-transparent border-l-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <h3 className="text-sm font-medium line-clamp-2 leading-snug">{video.title}</h3>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                      {formatCount(video.view_count)} views · {timeAgo(video.published_date || video.created_date)}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Community tab */}
        {activeTab === "community" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl pb-12">
            <CommunityPosts />
          </motion.div>
        )}
      </div>

      {/* Video modal */}
      {selectedVideo && (
        <VideoPlayerModal
          video={selectedVideo}
          channel={channel}
          relatedVideos={channelVideos}
          channelMap={channelMap}
          onClose={() => setSelectedVideo(null)}
          onSelectVideo={setSelectedVideo}
        />
      )}
    </div>
  );
}