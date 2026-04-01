import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, ThumbsUp, ThumbsDown, Share2, Bell, MoreHorizontal, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function formatViews(n) {
  if (!n) return "0";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n;
}

function timeAgo(dateStr) {
  if (!dateStr) return "recently";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export default function VideoPlayerModal({ video, channel, relatedVideos = [], channelMap = {}, onClose, onSelectVideo }) {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
    base44.entities.VideoComment.filter({ video_id: video.id }, "-created_date", 20)
      .then(setComments).catch(() => {});
  }, [video.id]);

  const handleLike = () => { setLiked(!liked); if (disliked) setDisliked(false); };
  const handleDislike = () => { setDisliked(!disliked); if (liked) setLiked(false); };

  const submitComment = async () => {
    if (!commentText.trim() || !user) return;
    const c = await base44.entities.VideoComment.create({
      video_id: video.id,
      channel_id: video.channel_id,
      author_email: user.email,
      author_name: user.full_name || user.email,
      content: commentText,
    });
    setComments(prev => [c, ...prev]);
    setCommentText("");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center overflow-y-auto pt-4 pb-8 px-2"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          className="w-full max-w-6xl"
        >
          {/* Close */}
          <div className="flex justify-end mb-2">
            <button onClick={onClose} className="text-white/80 hover:text-white bg-zinc-800 rounded-full p-2">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal body */}
          <div className="bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Left: Player + Info */}
              <div className="flex-1 min-w-0 p-4">
                {/* Video Player */}
                <div className="aspect-video bg-black rounded-xl overflow-hidden">
                  {video.video_url ? (
                    <video src={video.video_url} controls autoPlay className="w-full h-full" poster={video.thumbnail_url} />
                  ) : (
                    <div className="relative w-full h-full">
                      <img
                        src={video.thumbnail_url || `https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800&h=450&fit=crop&sig=${video.id}`}
                        alt={video.title}
                        className="w-full h-full object-cover opacity-60"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/60 rounded-full p-4">
                          <div className="w-0 h-0 border-t-[16px] border-b-[16px] border-l-[28px] border-transparent border-l-white ml-1" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-gray-900 dark:text-white font-bold text-lg mt-3 mb-2 leading-snug">{video.title}</h1>

                {/* Channel + Actions */}
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {channel?.channel_name?.charAt(0) || "C"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">{channel?.channel_name || "Creator"}</p>
                      <p className="text-gray-500 dark:text-zinc-400 text-xs">{formatViews(channel?.subscriber_count || 0)} subscribers</p>
                    </div>
                    <button
                      onClick={() => setSubscribed(!subscribed)}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors flex-shrink-0 ${
                        subscribed
                          ? "bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-300 dark:hover:bg-zinc-600"
                          : "bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-700 dark:hover:bg-zinc-200"
                      }`}
                    >
                      {subscribed ? <span className="flex items-center gap-1"><Bell className="w-3.5 h-3.5" /> Subscribed</span> : "Subscribe"}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <button
                        onClick={handleLike}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors hover:bg-gray-200 dark:hover:bg-zinc-700 ${liked ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-zinc-400"}`}
                      >
                        <ThumbsUp className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                        <span>{formatViews((video.like_count || 0) + (liked ? 1 : 0))}</span>
                      </button>
                      <div className="w-px h-5 bg-gray-300 dark:bg-zinc-700" />
                      <button
                        onClick={handleDislike}
                        className={`px-3 py-1.5 transition-colors hover:bg-gray-200 dark:hover:bg-zinc-700 ${disliked ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-zinc-400"}`}
                      >
                        <ThumbsDown className={`w-4 h-4 ${disliked ? "fill-current" : ""}`} />
                      </button>
                    </div>
                    <button className="flex items-center gap-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-full px-3 py-1.5 text-sm transition-colors">
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                    <button className="bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 dark:text-zinc-300 rounded-full p-1.5 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-gray-100 dark:bg-zinc-800 rounded-xl p-3 mb-4">
                  <p className="text-gray-900 dark:text-white text-sm font-semibold mb-1">
                    {formatViews(video.view_count || 0)} views · {timeAgo(video.published_date || video.created_date)}
                  </p>
                  <p className={`text-gray-600 dark:text-zinc-300 text-sm whitespace-pre-line ${!descExpanded ? "line-clamp-2" : ""}`}>
                    {video.description || "No description provided."}
                  </p>
                  {(video.description?.length || 0) > 100 && (
                    <button onClick={() => setDescExpanded(!descExpanded)} className="text-gray-900 dark:text-white text-sm font-semibold mt-1 flex items-center gap-1">
                      {descExpanded ? <><ChevronUp className="w-4 h-4" /> Show less</> : <><ChevronDown className="w-4 h-4" /> Show more</>}
                    </button>
                  )}
                </div>

                {/* Comments */}
                <div>
                  <h3 className="text-gray-900 dark:text-white font-semibold mb-3">{comments.length} Comments</h3>
                  {user && (
                    <div className="flex gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {user.full_name?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1">
                        <input
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && submitComment()}
                          placeholder="Add a comment..."
                          className="w-full bg-transparent border-b border-gray-300 dark:border-zinc-600 focus:border-gray-700 dark:focus:border-white outline-none text-gray-900 dark:text-white text-sm pb-1 placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                        />
                        {commentText && (
                          <div className="flex justify-end gap-2 mt-2">
                            <button onClick={() => setCommentText("")} className="text-gray-500 dark:text-zinc-400 text-sm hover:text-gray-800 dark:hover:text-white px-3 py-1 rounded-full">Cancel</button>
                            <button onClick={submitComment} className="bg-gray-900 dark:bg-white text-white dark:text-black text-sm font-semibold px-4 py-1 rounded-full hover:bg-gray-700 dark:hover:bg-zinc-200">Comment</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    {comments.map(c => (
                      <div key={c.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {c.author_name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="text-gray-900 dark:text-white text-xs font-semibold">{c.author_name} <span className="text-gray-400 dark:text-zinc-500 font-normal">{timeAgo(c.created_date)}</span></p>
                          <p className="text-gray-700 dark:text-zinc-300 text-sm mt-0.5">{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Related Videos */}
              <div className="lg:w-80 xl:w-96 flex-shrink-0 p-4 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-zinc-800 space-y-3">
                <p className="text-gray-900 dark:text-white text-sm font-semibold mb-2">Up next</p>
                {relatedVideos.filter(v => v.id !== video.id).slice(0, 12).map(v => (
                  <div key={v.id} onClick={() => onSelectVideo(v)} className="flex gap-2 cursor-pointer group">
                    <div className="relative w-40 aspect-video flex-shrink-0 bg-gray-200 dark:bg-zinc-800 rounded-lg overflow-hidden">
                      <img
                        src={v.thumbnail_url || `https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=200&h=112&fit=crop&sig=${v.id}`}
                        alt={v.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 dark:text-white text-xs font-medium line-clamp-2 leading-snug">{v.title}</p>
                      <p className="text-gray-500 dark:text-zinc-400 text-xs mt-1">{channelMap[v.channel_id]?.channel_name || "Creator"}</p>
                      <p className="text-gray-400 dark:text-zinc-500 text-xs">{formatViews(v.view_count || 0)} views</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}