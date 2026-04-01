import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, TrendingUp, Play, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

export default function AIContentAdvisor({ videos = [], channels = [], user }) {
  const [streamerAdvice, setStreamerAdvice] = useState(null);
  const [viewerIdeas, setViewerIdeas] = useState(null);
  const [loadingStreamer, setLoadingStreamer] = useState(false);
  const [loadingViewer, setLoadingViewer] = useState(false);
  const [streamerOpen, setStreamerOpen] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(true);

  const myChannel = channels[0];
  const categories = [...new Set(videos.map(v => v.category).filter(Boolean))];
  const tags = [...new Set(videos.flatMap(v => v.tags || []))].slice(0, 10);
  const contentSummary = categories.length > 0 ? categories.join(", ") : tags.join(", ") || "general content";

  const fetchStreamerAdvice = async () => {
    setLoadingStreamer(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Planify, an AI advisor for content creators. The user is a streamer/creator who makes content about: ${contentSummary}. Their channel is: ${myChannel?.channel_name || "unknown"}. 

Give them 4 specific, actionable trending content ideas that match their niche RIGHT NOW. For each idea include: a catchy title idea, why it's trending, and one quick tip. Be concise, energetic, and practical. Format as a JSON array.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          advice: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                why_trending: { type: "string" },
                tip: { type: "string" }
              }
            }
          }
        }
      }
    });
    setStreamerAdvice(result.advice || []);
    setLoadingStreamer(false);
  };

  const fetchViewerIdeas = async () => {
    setLoadingViewer(true);
    const videoTitles = videos.slice(0, 8).map(v => v.title).join(", ");
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Planify, a smart content recommender. Based on these videos available on this platform: ${videoTitles || "various content"}, give viewers 4 personalized "what to watch" suggestions. Each should have a reason why they'd enjoy it and a mood/vibe tag. Be fun and conversational. Format as JSON.`,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                suggestion: { type: "string" },
                reason: { type: "string" },
                vibe: { type: "string" }
              }
            }
          }
        }
      }
    });
    setViewerIdeas(result.suggestions || []);
    setLoadingViewer(false);
  };

  return (
    <div className="space-y-3">
      {/* Streamer Advice */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800 transition-colors"
          onClick={() => setStreamerOpen(!streamerOpen)}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-white">Trending for You</span>
            <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">Creator</span>
          </div>
          {streamerOpen ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
        </button>

        {streamerOpen && (
          <div className="px-4 pb-4">
            {!streamerAdvice && !loadingStreamer && (
              <div className="text-center py-4">
                <p className="text-xs text-zinc-400 mb-3">Get AI-powered trend advice tailored to your content niche</p>
                <button
                  onClick={fetchStreamerAdvice}
                  className="flex items-center gap-2 mx-auto bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Get Trends
                </button>
              </div>
            )}
            {loadingStreamer && (
              <div className="flex items-center justify-center py-6 gap-2 text-zinc-400 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                Analyzing trends for your niche...
              </div>
            )}
            {streamerAdvice && (
              <div className="space-y-3 mt-1">
                {streamerAdvice.map((item, i) => (
                  <div key={i} className="bg-zinc-800 rounded-lg p-3">
                    <p className="text-xs font-semibold text-white mb-1">💡 {item.title}</p>
                    <p className="text-xs text-zinc-400 mb-1">🔥 {item.why_trending}</p>
                    <p className="text-xs text-cyan-400">✓ {item.tip}</p>
                  </div>
                ))}
                <button onClick={fetchStreamerAdvice} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-1">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Viewer Ideas */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800 transition-colors"
          onClick={() => setViewerOpen(!viewerOpen)}
        >
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-white">What to Watch</span>
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">For You</span>
          </div>
          {viewerOpen ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
        </button>

        {viewerOpen && (
          <div className="px-4 pb-4">
            {!viewerIdeas && !loadingViewer && (
              <div className="text-center py-4">
                <p className="text-xs text-zinc-400 mb-3">Get personalized watch recommendations from Planify</p>
                <button
                  onClick={fetchViewerIdeas}
                  className="flex items-center gap-2 mx-auto bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Suggest Something
                </button>
              </div>
            )}
            {loadingViewer && (
              <div className="flex items-center justify-center py-6 gap-2 text-zinc-400 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                Finding perfect picks for you...
              </div>
            )}
            {viewerIdeas && (
              <div className="space-y-3 mt-1">
                {viewerIdeas.map((item, i) => (
                  <div key={i} className="bg-zinc-800 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs font-semibold text-white">🎬 {item.suggestion}</p>
                      <span className="text-xs bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded flex-shrink-0">{item.vibe}</span>
                    </div>
                    <p className="text-xs text-zinc-400">{item.reason}</p>
                  </div>
                ))}
                <button onClick={fetchViewerIdeas} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-1">
                  <RefreshCw className="w-3 h-3" /> New picks
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}