import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Play, RefreshCw } from "lucide-react";

export default function AIContentAdvisor({ videos = [], channels = [], user }) {
  const [viewerIdeas, setViewerIdeas] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchViewerIdeas = async () => {
    setLoading(true);
    const videoTitles = videos.slice(0, 8).map(v => v.title).join(", ");
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a smart content recommender for a streaming platform. Based on these videos: ${videoTitles || "various content"}, give 4 personalized "what to watch" suggestions. Each should have a short reason and a mood/vibe tag. Be fun and conversational.`,
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
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      {!viewerIdeas && !loading && (
        <div className="text-center py-3">
          <p className="text-xs text-blue-400/40 mb-3">Get personalized picks based on what's available</p>
          <button
            onClick={fetchViewerIdeas}
            className="flex items-center gap-2 mx-auto bg-[#a855f7]/20 hover:bg-[#a855f7]/30 border border-[#a855f7]/40 text-[#a855f7] text-xs font-bold px-4 py-2 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Suggest Something
          </button>
        </div>
      )}
      {loading && (
        <div className="flex items-center justify-center py-6 gap-2 text-blue-400/40 text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-[#a855f7]" />
          Finding perfect picks...
        </div>
      )}
      {viewerIdeas && (
        <div className="space-y-2">
          {viewerIdeas.map((item, i) => (
            <div key={i} className="bg-[#0a1525] border border-blue-900/30 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-xs font-semibold text-[#c8dff5]">🎬 {item.suggestion}</p>
                <span className="text-xs bg-[#a855f7]/15 text-[#a855f7] px-1.5 py-0.5 rounded flex-shrink-0">{item.vibe}</span>
              </div>
              <p className="text-xs text-blue-400/50">{item.reason}</p>
            </div>
          ))}
          <button onClick={fetchViewerIdeas} className="flex items-center gap-1.5 text-xs text-blue-400/30 hover:text-blue-300 transition-colors mt-1">
            <RefreshCw className="w-3 h-3" /> New picks
          </button>
        </div>
      )}
    </div>
  );
}