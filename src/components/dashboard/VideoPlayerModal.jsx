import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { X, ThumbsUp, ThumbsDown, Share2, Bell, MoreHorizontal, ChevronUp, ChevronDown, Settings, Clock, Scissors } from "lucide-react";
import MerchShelf from "@/components/video/MerchShelf";
import ClipsMaker from "@/components/video/ClipsMaker";
import { motion, AnimatePresence } from "framer-motion";

function timeAgoShort(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

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
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [sleepTimer, setSleepTimer] = useState(null);
  const [sleepCountdown, setSleepCountdown] = useState(null);
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [activeTab, setActiveTab] = useState("comments");
  const videoRef = useRef(null);
  const sleepTimerRef = useRef(null);
  const sleepIntervalRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
    base44.entities.VideoComment.filter({ video_id: video.id }, "-created_date", 20)
      .then(setComments).catch(() => {});
  }, [video.id]);

  const handleLike = () => { setLiked(!liked); if (disliked) setDisliked(false); };
  const handleDislike = () => { setDisliked(!disliked); if (liked) setLiked(false); };

  const setSpeed = (speed) => {
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    if (videoRef.current) videoRef.current.playbackRate = speed;
  };

  const startSleepTimer = (minutes) => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
    const secs = minutes * 60;
    setSleepCountdown(secs);
    setSleepTimer(minutes);
    setShowSleepMenu(false);
    sleepIntervalRef.current = setInterval(() => {
      setSleepCountdown(prev => {
        if (prev <= 1) {
          clearInterval(sleepIntervalRef.current);
          if (videoRef.current) videoRef.current.pause();
          setSleepTimer(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSleepTimer = () => {
    clearTimeout(sleepTimerRef.current);
    clearInterval(sleepIntervalRef.current);
    setSleepTimer(null);
    setSleepCountdown(null);
  };

  const [commentVotes, setCommentVotes] = useState({});

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

  const handleCommentVote = (commentId, type) => {
    setCommentVotes(prev => {
      const current = prev[commentId];
      return { ...prev, [commentId]: current === type ? null : type };
    });
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
                    <video ref={videoRef} src={video.video_url} controls autoPlay className="w-full h-full" poster={video.thumbnail_url} />
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
                      <button onClick={handleLike} className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors hover:bg-gray-200 dark:hover:bg-zinc-700 ${liked ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-zinc-400"}`}>
                        <ThumbsUp className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                        <span>{formatViews((video.like_count || 0) + (liked ? 1 : 0))}</span>
                      </button>
                      <div className="w-px h-5 bg-gray-300 dark:bg-zinc-700" />
                      <button onClick={handleDislike} className={`px-3 py-1.5 transition-colors hover:bg-gray-200 dark:hover:bg-zinc-700 ${disliked ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-zinc-400"}`}>
                        <ThumbsDown className={`w-4 h-4 ${disliked ? "fill-current" : ""}`} />
                      </button>
                    </div>
                    <button className="flex items-center gap-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-full px-3 py-1.5 text-sm transition-colors">
                      <Share2 className="w-4 h-4" /> Share
                    </button>

                    {/* Playback Speed */}
                    <div className="relative">
                      <button onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowSleepMenu(false); }}
                        className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors">
                        <Settings className="w-3.5 h-3.5" /> {playbackSpeed}x
                      </button>
                      {showSpeedMenu && (
                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg z-10 py-1 min-w-[100px]">
                          {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(s => (
                            <button key={s} onClick={() => setSpeed(s)}
                              className={`w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-gray-50 dark:hover:bg-zinc-700 ${playbackSpeed === s ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-gray-700 dark:text-zinc-300"}`}>
                              {s === 1 ? "Normal" : `${s}x`}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Sleep Timer */}
                    <div className="relative">
                      <button onClick={() => { setShowSleepMenu(!showSleepMenu); setShowSpeedMenu(false); }}
                        className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                          sleepTimer ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400" : "bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300"
                        }`}>
                        <Clock className="w-3.5 h-3.5" />
                        {sleepCountdown ? `${Math.floor(sleepCountdown/60)}:${String(sleepCountdown%60).padStart(2,"0")}` : "Sleep"}
                      </button>
                      {showSleepMenu && (
                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg z-10 py-1 min-w-[120px]">
                          {[15, 30, 60, 90].map(mins => (
                            <button key={mins} onClick={() => startSleepTimer(mins)}
                              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
                              {mins} minutes
                            </button>
                          ))}
                          {sleepTimer && (
                            <button onClick={cancelSleepTimer} className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors border-t border-gray-100 dark:border-zinc-700">
                              Cancel Timer
                            </button>
                          )}
                        </div>
                      )}
                    </div>

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

                {/* Tabs: Comments, Clips, Merch */}
                <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800 mb-4">
                  {["comments", "clips", "merch"].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
                        activeTab === tab ? "border-gray-900 dark:border-white text-gray-900 dark:text-white" : "border-transparent text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300"
                      }`}>
                      {tab}
                    </button>
                  ))}
                </div>

                {activeTab === "comments" && (
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
                  <div className="space-y-4">
                    {comments.map(c => {
                      const vote = commentVotes[c.id];
                      const likes = (c.likes || 0) + (vote === "up" ? 1 : 0);
                      return (
                        <div key={c.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {c.author_name?.charAt(0) || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 dark:text-white text-xs font-semibold">
                              {c.author_name}
                              <span className="text-gray-400 dark:text-zinc-500 font-normal ml-1.5">{timeAgoShort(c.created_date)}</span>
                            </p>
                            <p className="text-gray-700 dark:text-zinc-300 text-sm mt-0.5 leading-relaxed">{c.content}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <button onClick={() => handleCommentVote(c.id, "up")}
                                className={`flex items-center gap-1 text-xs transition-colors ${vote === "up" ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300"}`}>
                                <ThumbsUp className={`w-3.5 h-3.5 ${vote === "up" ? "fill-current" : ""}`} />
                                {likes > 0 && <span>{likes}</span>}
                              </button>
                              <button onClick={() => handleCommentVote(c.id, "down")}
                                className={`flex items-center gap-1 text-xs transition-colors ${vote === "down" ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300"}`}>
                                <ThumbsDown className={`w-3.5 h-3.5 ${vote === "down" ? "fill-current" : ""}`} />
                              </button>
                              <button className="text-xs text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 font-medium transition-colors">Reply</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                )}

                {activeTab === "clips" && <ClipsMaker video={video} isViewer={true} />}
                {activeTab === "merch" && <MerchShelf isOwner={false} />}
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