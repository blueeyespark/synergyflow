import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image, BarChart2, X, ThumbsUp, MessageCircle, Send, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

function timeAgo(dateStr) {
  if (!dateStr) return "recently";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function PostCard({ post, user, onLike, onComment }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [localLikes, setLocalLikes] = useState(post.likes || 0);
  const [liked, setLiked] = useState(false);

  const handleLike = () => {
    if (liked) return;
    setLiked(true);
    setLocalLikes(l => l + 1);
    onLike(post.id, localLikes + 1);
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    await onComment(post.id, commentText);
    setCommentText("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
          {post.author_name?.charAt(0) || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{post.author_name || "Creator"}</p>
          <p className="text-xs text-gray-400 dark:text-zinc-500">{timeAgo(post.created_date)}</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed">{post.content}</p>
      </div>

      {/* Image */}
      {post.image_url && (
        <img src={post.image_url} alt="Post" className="w-full max-h-80 object-cover" />
      )}

      {/* Poll */}
      {post.poll_options?.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase mb-2">Poll</p>
          <div className="space-y-2">
            {post.poll_options.map((opt, i) => {
              const votes = post.poll_votes?.[i] || 0;
              const total = post.poll_options.reduce((s, _, idx) => s + (post.poll_votes?.[idx] || 0), 0);
              const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
              return (
                <div key={i} className="relative bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
                  <div className="absolute inset-0 bg-indigo-200/60 dark:bg-indigo-900/50 rounded-lg" style={{ width: `${pct}%` }} />
                  <div className="relative flex items-center justify-between px-3 py-2">
                    <span className="text-sm text-gray-800 dark:text-zinc-200">{opt}</span>
                    <span className="text-xs text-gray-500 dark:text-zinc-400">{pct}%</span>
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-gray-400 dark:text-zinc-500">{(post.poll_votes || []).reduce((a, b) => a + b, 0)} votes</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-4 pb-3 border-t border-gray-100 dark:border-zinc-800 pt-3">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
            liked ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400" : "hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400"
          }`}
        >
          <ThumbsUp className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
          {localLikes > 0 && <span>{localLikes}</span>}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          {(post.comments?.length || 0) > 0 && <span>{post.comments.length}</span>}
          <span>Comment</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-zinc-800 pt-3">
          {(post.comments || []).map((c, i) => (
            <div key={i} className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {c.author?.charAt(0) || "U"}
              </div>
              <div className="bg-gray-100 dark:bg-zinc-800 rounded-xl px-3 py-2 flex-1">
                <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300">{c.author}</p>
                <p className="text-sm text-gray-700 dark:text-zinc-300">{c.text}</p>
              </div>
            </div>
          ))}
          {user && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user.full_name?.charAt(0) || "U"}
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleComment()}
                  placeholder="Add a comment..."
                  className="flex-1 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white text-sm rounded-full px-4 py-1.5 outline-none border border-transparent focus:border-indigo-400 dark:focus:border-indigo-600 placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                />
                <button onClick={handleComment} className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function CreatePostBox({ user, onPost }) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!content.trim()) return;
    setPosting(true);
    const poll = showPoll ? pollOptions.filter(o => o.trim()) : [];
    await onPost({
      content,
      image_url: imageUrl || null,
      poll_options: poll.length >= 2 ? poll : null,
      poll_votes: poll.length >= 2 ? poll.map(() => 0) : null,
      author_name: user?.full_name || user?.email || "Creator",
      author_email: user?.email,
      likes: 0,
      comments: [],
    });
    setContent("");
    setImageUrl("");
    setShowImageInput(false);
    setShowPoll(false);
    setPollOptions(["", ""]);
    setPosting(false);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
          {user?.full_name?.charAt(0) || "U"}
        </div>
        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Share something with your community..."
          className="flex-1 resize-none bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 rounded-xl min-h-[80px]"
        />
      </div>

      {showImageInput && (
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="Paste image URL..."
            className="flex-1 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 outline-none border border-gray-200 dark:border-zinc-700 placeholder:text-gray-400"
          />
          <button onClick={() => { setShowImageInput(false); setImageUrl(""); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showPoll && (
        <div className="space-y-2 pl-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase">Poll Options</p>
          {pollOptions.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={opt}
                onChange={e => { const n = [...pollOptions]; n[i] = e.target.value; setPollOptions(n); }}
                placeholder={`Option ${i + 1}`}
                className="flex-1 bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-1.5 outline-none border border-gray-200 dark:border-zinc-700"
              />
              {pollOptions.length > 2 && (
                <button onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {pollOptions.length < 5 && (
            <button onClick={() => setPollOptions([...pollOptions, ""])} className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
              <Plus className="w-3 h-3" /> Add option
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-1">
          <button
            onClick={() => { setShowImageInput(!showImageInput); setShowPoll(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${showImageInput ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600" : "text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"}`}
          >
            <Image className="w-4 h-4" /> Photo
          </button>
          <button
            onClick={() => { setShowPoll(!showPoll); setShowImageInput(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${showPoll ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600" : "text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"}`}
          >
            <BarChart2 className="w-4 h-4" /> Poll
          </button>
        </div>
        <Button onClick={handlePost} disabled={!content.trim() || posting} className="rounded-full px-5">
          {posting ? "Posting..." : "Post"}
        </Button>
      </div>
    </div>
  );
}

export default function CommunityPosts() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["community-posts"],
    queryFn: () => base44.entities.SocialPost.filter({ platform: "youtube" }, "-created_date", 50),
    staleTime: 30000,
  });

  const createPost = async (postData) => {
    await base44.entities.SocialPost.create({
      title: postData.content.substring(0, 60),
      content: postData.content,
      platform: "youtube",
      media_type: postData.image_url ? "image" : postData.poll_options ? "other" : "text",
      posted_by: postData.author_email,
      posted_date: new Date().toISOString().split("T")[0],
      file_urls: postData.image_url ? [postData.image_url] : [],
      // Store extra community data in channel field as JSON
      channel: JSON.stringify({
        author_name: postData.author_name,
        author_email: postData.author_email,
        image_url: postData.image_url,
        poll_options: postData.poll_options,
        poll_votes: postData.poll_votes,
        likes: 0,
        comments: [],
      }),
    });
    queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    toast.success("Post shared with the community!");
  };

  const handleLike = async (postId, newLikes) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const meta = safeParseChannel(post.channel);
    meta.likes = newLikes;
    await base44.entities.SocialPost.update(postId, { channel: JSON.stringify(meta) });
    queryClient.invalidateQueries({ queryKey: ["community-posts"] });
  };

  const handleComment = async (postId, text) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const meta = safeParseChannel(post.channel);
    meta.comments = [...(meta.comments || []), { author: user?.full_name || user?.email, text, time: new Date().toISOString() }];
    await base44.entities.SocialPost.update(postId, { channel: JSON.stringify(meta) });
    queryClient.invalidateQueries({ queryKey: ["community-posts"] });
  };

  // Normalise post data from SocialPost entity
  const normalisedPosts = posts.map(p => {
    const meta = safeParseChannel(p.channel);
    return {
      id: p.id,
      created_date: p.created_date,
      content: p.content || p.title,
      author_name: meta.author_name || p.posted_by || "Creator",
      image_url: meta.image_url || (p.file_urls?.[0]),
      poll_options: meta.poll_options || null,
      poll_votes: meta.poll_votes || null,
      likes: meta.likes || 0,
      comments: meta.comments || [],
    };
  });

  function safeParseChannel(str) {
    try { return str ? JSON.parse(str) : {}; } catch { return {}; }
  }

  return (
    <div className="space-y-4">
      <CreatePostBox user={user} onPost={createPost} />

      {isLoading ? (
        <div className="text-center py-8 text-gray-400 dark:text-zinc-500 text-sm">Loading posts...</div>
      ) : normalisedPosts.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-zinc-600">
          <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No community posts yet. Be the first to post!</p>
        </div>
      ) : (
        <AnimatePresence>
          {normalisedPosts.map(post => (
            <PostCard key={post.id} post={post} user={user} onLike={handleLike} onComment={handleComment} />
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}