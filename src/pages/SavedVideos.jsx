import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark, PlaySquare, ArrowLeft, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import VideoPlayerModal from "@/components/dashboard/VideoPlayerModal";

function VideoCard({ video, channel, onClick, compact = false }) {
  if (compact) {
    return (
      <div className="flex gap-2.5 cursor-pointer group" onClick={() => onClick(video)}>
        <div className="relative w-36 aspect-video rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-[#060d18]">
          <img src={video.thumbnail_url || `https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=200&h=113&fit=crop&sig=${video.id}`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-xs font-semibold text-[#e8f4ff] line-clamp-2 leading-snug">{video.title}</p>
          <p className="text-xs text-blue-400/50 mt-1 truncate">{channel?.channel_name || "Creator"}</p>
          <p className="text-xs text-blue-400/30 mt-0.5">{video.view_count?.toLocaleString() || 0} views</p>
        </div>
      </div>
    );
  }
  return null;
}

export default function SavedVideos() {
  const [user, setUser] = useState(null);
  const [watchLater, setWatchLater] = useState(() => {
    try { return JSON.parse(localStorage.getItem("watchLater") || "[]"); } catch { return []; }
  });
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: channels = [] } = useQuery({
    queryKey: ["channels-all"],
    queryFn: () => base44.entities.Channel.list(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: videos = [] } = useQuery({
    queryKey: ["videos-all"],
    queryFn: () => base44.entities.Video.list("-created_date", 80),
    staleTime: 5 * 60 * 1000,
  });

  const { data: playlists = [] } = useQuery({
    queryKey: ["playlists", user?.email],
    queryFn: () => user?.email ? base44.entities.Playlist.filter({ owner_email: user.email }) : [],
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
  });

  const addToPlaylistMutation = useMutation({
    mutationFn: ({ playlistId, videoId }) => {
      const playlist = playlists.find(p => p.id === playlistId);
      const updated = [...(playlist?.video_ids || []), videoId].filter((id, idx, arr) => arr.indexOf(id) === idx);
      return base44.entities.Playlist.update(playlistId, { video_ids: updated });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      setShowPlaylistModal(false);
    },
  });

  const channelMap = channels.reduce((acc, c) => { acc[c.id] = c; return acc; }, {});
  const savedVideos = videos.filter(v => watchLater.includes(v.id));

  const handleOpenVideo = (video) => {
    setSelectedVideo(video);
  };

  const removeSaved = (videoId) => {
    const updated = watchLater.filter(id => id !== videoId);
    setWatchLater(updated);
    localStorage.setItem("watchLater", JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Link to="/" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-400/20 flex items-center justify-center">
              <Bookmark className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#e8f4ff]">Saved Videos</h1>
              <p className="text-sm text-blue-400/50 mt-1">{savedVideos.length} videos saved</p>
            </div>
          </div>
          {savedVideos.length > 0 && (
            <button onClick={() => { localStorage.removeItem("watchLater"); setWatchLater([]); }} className="text-xs text-red-400/60 hover:text-red-400 font-semibold transition-colors">
              Clear All
            </button>
          )}
        </div>

        {savedVideos.length > 0 ? (
          <div className="space-y-4">
            <AnimatePresence>
              {savedVideos.map((v, i) => (
                <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="flex items-center justify-between group">
                  <div className="flex-1" onClick={() => handleOpenVideo(v)}>
                    <VideoCard video={v} channel={channelMap[v.channel_id]} onClick={handleOpenVideo} compact />
                  </div>
                  <div className="ml-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => setShowPlaylistModal(v.id)} className="px-3 py-1.5 text-xs text-blue-400/60 hover:text-blue-400 border border-blue-400/20 hover:border-blue-400/40 rounded-lg transition-all flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add to Playlist
                    </button>
                    <button onClick={() => removeSaved(v.id)} className="px-3 py-1.5 text-xs text-red-400/60 hover:text-red-400 border border-red-400/20 hover:border-red-400/40 rounded-lg transition-all">
                      Remove
                    </button>
                  </div>
                  {showPlaylistModal === v.id && (
                    <div className="absolute right-0 top-full mt-2 z-50 bg-card border border-[#0d2040] rounded-lg shadow-xl w-48 py-2">
                      {playlists.length > 0 ? (
                        playlists.map(p => (
                          <button
                            key={p.id}
                            onClick={() => addToPlaylistMutation.mutate({ playlistId: p.id, videoId: v.id })}
                            className="w-full text-left px-4 py-2 text-xs text-[#c8dff5] hover:bg-blue-900/20 transition-colors"
                          >
                            {p.name}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-xs text-blue-400/40">No playlists yet. <Link to="/Playlists" className="text-blue-400 hover:text-blue-300">Create one</Link></div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-[#050a14] border border-slate-300 dark:border-[#0d1820] flex items-center justify-center mb-4">
              <Bookmark className="w-7 h-7 text-slate-400 dark:text-blue-400/30" />
            </div>
            <h3 className="text-foreground dark:text-[#e8f4ff] font-bold text-lg mb-1">Nothing saved yet</h3>
            <p className="text-slate-600 dark:text-blue-400/40 text-sm mb-5">Hover a video and click ⋯ → Watch Later</p>
            <Link to="/" className="text-sm text-[#1e78ff] hover:text-[#00c8ff] font-semibold">Browse videos →</Link>
          </div>
        )}
      </div>

      {selectedVideo && (
        <VideoPlayerModal
          video={selectedVideo}
          channel={channelMap[selectedVideo.channel_id]}
          relatedVideos={savedVideos}
          channelMap={channelMap}
          onClose={() => setSelectedVideo(null)}
          onSelectVideo={v => { setSelectedVideo(v); handleOpenVideo(v); }}
        />
      )}
    </div>
  );
}