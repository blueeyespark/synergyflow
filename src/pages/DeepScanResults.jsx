import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Code, Wand2, Loader2, Check, Youtube, Tv, Zap, Users, DollarSign, MessageSquare, BarChart3, Settings, Play, Star } from "lucide-react";
import { toast } from "sonner";
import CodePreviewModal from "@/components/scanner/CodePreviewModal";

const YOUTUBE_FUNCTIONS = [
  { category: "Video Playback", name: "Fine-tunable Playback Speed", description: "Adjust playback speed in 0.05 increments (0.25x to 2x). A slider in the settings menu updates the video element's playbackRate.", how_it_works: "HTML5 video.playbackRate property. UI: dropdown or slider with steps of 0.05.", effort: "low" },
  { category: "Video Playback", name: "Floating Miniplayer", description: "A resizable, draggable picture-in-picture player that persists while the user browses other videos.", how_it_works: "Use Picture-in-Picture Web API or a floating <video> overlay with drag/resize handlers. State persists in context.", effort: "medium" },
  { category: "Video Playback", name: "Sleep Timer", description: "Auto-pause video after a user-set duration (15min, 30min, 60min or custom).", how_it_works: "setTimeout that calls video.pause(). Countdown shown in corner of player. Cancel button clears the timer.", effort: "low" },
  { category: "Discovery", name: "AI-Powered Search", description: "Conversational search with intent understanding — 'show me gaming videos from this week'.", how_it_works: "Pass user query + context to LLM, return structured filters (category, date, duration). Apply filters to video list.", effort: "medium" },
  { category: "Discovery", name: "Category Chip Filters", description: "Horizontal scrollable chips at the top of the feed that filter videos by topic in real-time.", how_it_works: "State variable activeCategory. Filter video array client-side. Already partially implemented in Dashboard.", effort: "low" },
  { category: "Discovery", name: "Trending / Trending Now Section", description: "Dedicated section showing trending videos ranked by recent view velocity.", how_it_works: "Sort by (view_count / days_since_publish) desc. Show rank badge (#1, #2...). Refresh every few minutes.", effort: "low" },
  { category: "Community", name: "Community Posts with Polls", description: "Creator posts text, images, or polls to their community tab. Viewers vote and comment.", how_it_works: "SocialPost entity storing post type, poll_options[], poll_votes[]. Vote increments index in array. Already implemented.", effort: "done" },
  { category: "Community", name: "Badges & Milestones", description: "Earn badges for being an early subscriber, liking X videos, commenting X times, watching X hours.", how_it_works: "Track viewer actions in a ViewerStats entity. Compare thresholds. Display badge grid in user profile/You tab.", effort: "medium" },
  { category: "Community", name: "Collaborative Playlists with QR code", description: "Invite friends to co-build a playlist via shareable link or QR code. Members can vote to reorder.", how_it_works: "Playlist entity with collaborators[] array. Voting stored as votes{} map on each entry. QR generated from playlist URL.", effort: "medium" },
  { category: "Monetization", name: "Super Chat / Live Donations", description: "Viewers pay to highlight their message in live chat, pinned for a set duration based on amount.", how_it_works: "Chat message with amount field. Sort highlighted messages by amount. Auto-expire after timeout. Stripe payment flow.", effort: "high" },
  { category: "Monetization", name: "Channel Memberships", description: "Monthly recurring subscriptions with tiers (e.g. $2.99, $4.99, $9.99) giving perks like badges, emotes, exclusive posts.", how_it_works: "Stripe recurring subscription. Tier stored on Subscription entity. Gate content/posts by tier check.", effort: "high" },
  { category: "Monetization", name: "YouTube Shopping / Merch Shelf", description: "Product shelf below or alongside video showing creator merchandise that viewers can buy.", how_it_works: "Products entity linked to channel. Displayed below video player. Click opens product page or external store URL.", effort: "medium" },
  { category: "Creator Tools", name: "YouTube Studio Analytics Dashboard", description: "Deep analytics: impressions, CTR, watch time, subscriber gain/loss, audience retention graph per video.", how_it_works: "VideoAnalytics entity per video per day. Charts: retention curve (area chart), impression funnel, top traffic sources.", effort: "medium" },
  { category: "Creator Tools", name: "AI Shorts Generator", description: "Take a long video, AI detects the best 30–60 second clip and generates a Short automatically.", how_it_works: "Pass video transcript/description to LLM. LLM returns start/end timestamps. Create new Short video entry. Use VideoEditor to trim.", effort: "high" },
  { category: "Creator Tools", name: "End Screens & Cards", description: "Overlay interactive cards at video end pointing to other videos, playlists, or subscribe button.", how_it_works: "Video metadata stores end_screens[] with timestamp, type, target_id. Player renders overlay div at correct timestamp.", effort: "medium" },
  { category: "Creator Tools", name: "Thumbnail A/B Testing", description: "Upload 2 thumbnails, YouTube shows each to a portion of viewers, pick the winner by CTR.", how_it_works: "Store two thumbnail URLs on video. Randomly assign thumbnail variant per user. Track clicks per variant. Show winner stats.", effort: "medium" },
  { category: "Shorts", name: "Shorts Feed (Vertical Swipe)", description: "Full-screen vertical video feed that auto-plays next Short on swipe-up. Like, comment, share overlaid on video.", how_it_works: "Full-height container. touch events for swipe detection. Auto-play next in array. Overlay action buttons.", effort: "medium" },
  { category: "Live", name: "Live Chat with Emotes", description: "Real-time chat during live streams with custom channel emotes, moderation tools, slow mode.", how_it_works: "WebSocket or base44 real-time subscription on ChatMessage entity. Filter by stream_id. Slow mode = rate limit per user.", effort: "medium" },
];

const TWITCH_FUNCTIONS = [
  { category: "Viewer Rewards", name: "Channel Points System", description: "Viewers earn points by watching, following, raiding. Spend points on custom rewards the streamer defines (e.g. choose next game, sound alert, dance emote).", how_it_works: "ChannelPoints entity per viewer per channel. Auto-increment on watch time. RewardRedemption entity. Streamer defines rewards in dashboard.", effort: "high" },
  { category: "Viewer Rewards", name: "Hype Train", description: "A community-wide challenge — when enough subs/cheers happen in a time window, a hype train starts. Level up together to unlock bigger rewards.", how_it_works: "Track cheer/sub events in real-time. Sum contributions in rolling 5-min window. When threshold hit, trigger HypeTrain with level progress bar in UI.", effort: "high" },
  { category: "Viewer Rewards", name: "Predictions", description: "Streamer poses a question (e.g. 'Will I win this match?'). Viewers bet Channel Points on outcomes. Winner takes the pot.", how_it_works: "Prediction entity with outcomes[], viewers place bets (PredictionBet entity). On resolve, distribute pool proportionally to winners.", effort: "medium" },
  { category: "Viewer Rewards", name: "Polls", description: "Streamer creates quick polls visible to all viewers. Results update live. Can be Channel Point powered.", how_it_works: "Poll entity with options[], vote_counts[]. Viewers click to vote (one vote per user). Live update via subscription. Already have community polls.", effort: "low" },
  { category: "Viewer Rewards", name: "Bits / Cheering", description: "Viewers buy Bits (virtual currency) and 'Cheer' in chat. Animated emotes appear, streamer earns money per bit.", how_it_works: "Bits are Stripe-purchased credits. Cheer message triggers animated overlay on stream. Leaderboard shows top cheerers.", effort: "high" },
  { category: "Community", name: "Raids", description: "At stream end, send your entire live audience to another channel's stream, boosting their viewer count with a raid message.", how_it_works: "Raid entity. On initiate, create a massive animated chat flood on target channel. Increment target's current_viewers. Notify target streamer.", effort: "medium" },
  { category: "Community", name: "Squad Stream / Co-Streaming", description: "Up to 4 streamers broadcast together in a split-screen layout. Viewers can watch all 4 simultaneously.", how_it_works: "SquadSession entity with participant channel IDs. Frontend renders 2x2 grid of embedded stream players. Shared chat feed.", effort: "high" },
  { category: "Community", name: "Clips", description: "Any viewer can create a 30-90 second clip from any stream or VOD. Clips are shareable and browsable.", how_it_works: "Clip entity stores source_video_id, start_time, duration. Player renders trimmed section. Clips have their own view counts & sharing.", effort: "medium" },
  { category: "Moderation", name: "AutoMod with AI", description: "AI automatically catches hate speech, spam, slurs in chat before they're posted. Mod approves or denies held messages.", how_it_works: "Pass chat message through LLM moderation check. If flagged, hold in moderation queue instead of publishing. Mod gets alert.", effort: "medium" },
  { category: "Moderation", name: "Mod Actions Dashboard", description: "Moderators see real-time stream of chat with quick timeout/ban/unban/block buttons per user.", how_it_works: "ChatMessage list with author info. Buttons call UserBan entity create. Banned users filtered from future messages.", effort: "medium" },
  { category: "Live Tools", name: "Stream Deck Integration UI", description: "A web-based stream control panel with big buttons for scene switching, alerts, chat actions, timers.", how_it_works: "Grid of customizable action buttons. Each button triggers an action (toggle overlay, send chat message, start/stop timer, play sound).", effort: "medium" },
  { category: "Live Tools", name: "Stream Goals / Alerts Overlay", description: "Animated browser-source overlay that shows new follower/sub alerts, goal progress bars.", how_it_works: "Subscribe to Subscription/Follow entity events. When new event fires, animate an overlay popup with sound + gif. Goal bar tracks progress.", effort: "medium" },
  { category: "Live Tools", name: "Category / Game Tagging", description: "Streamers tag their stream with game/category, letting viewers browse streams by category.", how_it_works: "Category entity. Stream has category_id. Viewers browse category page showing all live streams in that game.", effort: "low" },
  { category: "Monetization", name: "Subscriptions with Emotes", description: "Viewers subscribe (Tier 1/2/3) unlocking channel-specific emotes usable in any chat + ad-free viewing.", how_it_works: "Subscription entity with tier. EmoteSet entity per tier. Chat parser replaces emote codes with images. Check sub status for ad removal.", effort: "high" },
  { category: "Discovery", name: "Following Feed / Homepage", description: "Personalized homepage showing live channels from people you follow first, then recommendations.", how_it_works: "Subscription list determines follow_ids[]. Filter live channels by follow_ids. Show offline/recommended in secondary section.", effort: "medium" },
  { category: "Analytics", name: "Stream Recap / Annual Recap", description: "After each stream: total hours watched, peak viewers, new followers, top clips. Annual recap with highlights.", how_it_works: "Aggregate StreamSession entity data. Generate recap card with stats. Annual recap pulls all sessions by year.", effort: "medium" },
];

const EFFORT_COLOR = { low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", done: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
const CATEGORY_ICON = { "Video Playback": Play, "Discovery": Zap, "Community": Users, "Monetization": DollarSign, "Creator Tools": Settings, "Shorts": Star, "Live": Tv, "Viewer Rewards": Star, "Moderation": Settings, "Live Tools": Tv, "Analytics": BarChart3 };

function FeatureCard({ feature, platform, onImplement, implementing, codeReady }) {
  const Icon = CATEGORY_ICON[feature.category] || Code;
  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="outline" className="text-xs gap-1">
              <Icon className="w-3 h-3" />{feature.category}
            </Badge>
            <Badge className={`text-xs ${EFFORT_COLOR[feature.effort]}`}>
              {feature.effort === "done" ? "✓ Implemented" : `${feature.effort} effort`}
            </Badge>
          </div>
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{feature.name}</h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{feature.description}</p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">⚙️ {feature.how_it_works}</p>
        </div>
        {feature.effort !== "done" && (
          <Button
            size="sm"
            variant={codeReady ? "outline" : "default"}
            onClick={() => onImplement(feature, platform)}
            disabled={implementing === `${platform}-${feature.name}`}
            className="flex-shrink-0 text-xs gap-1"
          >
            {implementing === `${platform}-${feature.name}` ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : codeReady ? (
              <><Check className="w-3 h-3 text-green-500" /> View Code</>
            ) : (
              <><Code className="w-3 h-3" /> Generate Code</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

const CATEGORIES_YT = [...new Set(YOUTUBE_FUNCTIONS.map(f => f.category))];
const CATEGORIES_TW = [...new Set(TWITCH_FUNCTIONS.map(f => f.category))];

export default function DeepScanResults() {
  const [implementing, setImplementing] = useState(null);
  const [codeModal, setCodeModal] = useState(null);
  const [codeReady, setCodeReady] = useState(new Set());
  const [filterYT, setFilterYT] = useState("All");
  const [filterTW, setFilterTW] = useState("All");

  const handleImplement = async (feature, platform) => {
    const key = `${platform}-${feature.name}`;
    setImplementing(key);
    toast.loading(`Generating code for "${feature.name}"...`, { id: key });

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert React/Tailwind developer building "Planify" — a creator-focused platform (like YouTube + Twitch) built with React, Tailwind CSS, shadcn/ui, and base44 SDK.

Implement this ${platform} feature for Planify:
Feature: "${feature.name}"
Description: "${feature.description}"
How it works: "${feature.how_it_works}"

Generate a COMPLETE, PRODUCTION-READY React component:
- Tailwind CSS for ALL styling (dark: variants included)
- shadcn/ui from @/components/ui/ where appropriate
- lucide-react for icons (only use valid icons)
- base44 SDK: import { base44 } from '@/api/base44Client'; for data
- useQuery from @tanstack/react-query for data fetching
- export default function ComponentName() pattern
- Must be fully functional, not just a skeleton
- Include all state, handlers, and real UI logic

Return the FULL component code, the exact file path (e.g. components/live/ChannelPoints.jsx), and a brief explanation.`,
      model: "claude_sonnet_4_6",
      response_json_schema: {
        type: "object",
        properties: {
          code: { type: "string" },
          file_path: { type: "string" },
          explanation: { type: "string" }
        }
      }
    });

    // Log it
    await base44.entities.AIAppliedChange.create({
      title: feature.name,
      source: "external_scan",
      change_type: "feature",
      file_path: result.file_path || "",
      code_snippet: result.code || "",
      explanation: result.explanation || "",
      applied_by: "deep-scan",
      origin_site: platform,
    }).catch(() => {});

    setImplementing(null);
    setCodeReady(prev => new Set([...prev, key]));
    toast.success(`Code ready for "${feature.name}"`, { id: key });
    setCodeModal({
      title: `${platform}: ${feature.name}`,
      code: result.code || "// No code generated",
      description: result.explanation,
      filePath: result.file_path,
    });
  };

  const filteredYT = filterYT === "All" ? YOUTUBE_FUNCTIONS : YOUTUBE_FUNCTIONS.filter(f => f.category === filterYT);
  const filteredTW = filterTW === "All" ? TWITCH_FUNCTIONS : TWITCH_FUNCTIONS.filter(f => f.category === filterTW);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Deep Scan Results</h1>
              <p className="text-sm text-gray-500 dark:text-zinc-400">YouTube + Twitch — {YOUTUBE_FUNCTIONS.length + TWITCH_FUNCTIONS.length} functions detected</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {[
              { label: "YouTube Functions", value: YOUTUBE_FUNCTIONS.length, color: "text-red-600" },
              { label: "Twitch Functions", value: TWITCH_FUNCTIONS.length, color: "text-purple-600" },
              { label: "Low Effort Wins", value: [...YOUTUBE_FUNCTIONS, ...TWITCH_FUNCTIONS].filter(f => f.effort === "low").length, color: "text-green-600" },
              { label: "Already Done", value: [...YOUTUBE_FUNCTIONS, ...TWITCH_FUNCTIONS].filter(f => f.effort === "done").length, color: "text-blue-600" },
            ].map((s, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-3 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <Tabs defaultValue="youtube">
          <TabsList className="w-full mb-6 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
            <TabsTrigger value="youtube" className="flex-1 gap-2">
              <Youtube className="w-4 h-4 text-red-500" /> YouTube ({YOUTUBE_FUNCTIONS.length})
            </TabsTrigger>
            <TabsTrigger value="twitch" className="flex-1 gap-2">
              <Tv className="w-4 h-4 text-purple-500" /> Twitch ({TWITCH_FUNCTIONS.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="youtube">
            {/* Category filter */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4">
              {["All", ...CATEGORIES_YT].map(cat => (
                <button key={cat} onClick={() => setFilterYT(cat)}
                  className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filterYT === cat ? "bg-red-600 text-white" : "bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800"}`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {filteredYT.map((f, i) => (
                <motion.div key={f.name} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                  <FeatureCard feature={f} platform="YouTube" onImplement={handleImplement} implementing={implementing} codeReady={codeReady.has(`YouTube-${f.name}`)} />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="twitch">
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4">
              {["All", ...CATEGORIES_TW].map(cat => (
                <button key={cat} onClick={() => setFilterTW(cat)}
                  className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filterTW === cat ? "bg-purple-600 text-white" : "bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800"}`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {filteredTW.map((f, i) => (
                <motion.div key={f.name} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                  <FeatureCard feature={f} platform="Twitch" onImplement={handleImplement} implementing={implementing} codeReady={codeReady.has(`Twitch-${f.name}`)} />
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {codeModal && (
        <CodePreviewModal
          open={!!codeModal}
          onOpenChange={() => setCodeModal(null)}
          title={codeModal.title}
          code={codeModal.code}
          description={codeModal.description}
          filePath={codeModal.filePath}
        />
      )}
    </div>
  );
}