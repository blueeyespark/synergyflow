import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, TrendingUp, RefreshCw, Lightbulb, Zap, ExternalLink } from "lucide-react";

export default function TrendingForCreators() {
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: videos = [] } = useQuery({
    queryKey: ["videos-all"],
    queryFn: () => base44.entities.Video.list("-created_date", 20),
    staleTime: 5 * 60 * 1000,
  });

  const { data: channels = [] } = useQuery({
    queryKey: ["channels-all"],
    queryFn: () => base44.entities.Channel.list(),
    staleTime: 5 * 60 * 1000,
  });

  const categories = [...new Set(videos.map(v => v.category).filter(Boolean))];
  const tags = [...new Set(videos.flatMap(v => v.tags || []))].slice(0, 10);
  const contentSummary = categories.length > 0 ? categories.join(", ") : tags.join(", ") || "general content";
  const myChannel = channels[0];

  const fetchAdvice = async () => {
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an AI advisor for content creators. The creator makes content about: ${contentSummary}. Channel: ${myChannel?.channel_name || "unknown"}. Give 5 specific, actionable trending content ideas that match their niche RIGHT NOW in ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}. For each idea include: a catchy title idea, why it's trending, one quick tip, and a difficulty level (Easy/Medium/Hard). Be concise and practical.`,
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
                tip: { type: "string" },
                difficulty: { type: "string" }
              }
            }
          }
        }
      }
    });
    setAdvice(result.advice || []);
    setLoading(false);
  };

  const difficultyColor = {
    Easy: "text-green-400 bg-green-400/10 border-green-400/30",
    Medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    Hard: "text-red-400 bg-red-400/10 border-red-400/30",
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-[#1e78ff]/15 border border-[#1e78ff]/30 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-[#1e78ff]" />
        </div>
        <div>
          <h2 className="text-lg font-black text-[#e8f4ff]">Trending for You</h2>
          <p className="text-xs text-blue-400/50">AI-powered content ideas matched to your niche</p>
        </div>
      </div>

      {!advice && !loading && (
        <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#1e78ff]/10 border border-[#1e78ff]/20 flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-7 h-7 text-[#1e78ff]" />
          </div>
          <h3 className="text-[#e8f4ff] font-bold text-lg mb-1">Get Your Trend Report</h3>
          <p className="text-blue-400/50 text-sm mb-6 max-w-xs mx-auto">
            Analyze what's trending in your content niche and get actionable ideas to grow your channel.
          </p>
          <button
            onClick={fetchAdvice}
            className="flex items-center gap-2 mx-auto bg-[#1e78ff] hover:bg-[#3d8fff] text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-900/40"
          >
            <Sparkles className="w-4 h-4" /> Analyze My Niche
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-16 flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-[#1e78ff]/20" />
            <div className="absolute inset-0 rounded-full border-2 border-t-[#1e78ff] animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-[#c8dff5] font-semibold text-sm">Scanning trends across the web...</p>
            <p className="text-blue-400/40 text-xs mt-1">Analyzing your niche for the best opportunities</p>
          </div>
        </div>
      )}

      {advice && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-blue-400/50">{advice.length} ideas found for <span className="text-[#1e78ff]">{contentSummary}</span></p>
            <button onClick={fetchAdvice} disabled={loading} className="flex items-center gap-1.5 text-xs text-blue-400/50 hover:text-blue-300 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
          {advice.map((item, i) => (
            <div key={i} className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-5 hover:border-blue-700/60 transition-all">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-[#1e78ff]/15 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-3.5 h-3.5 text-[#1e78ff]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#e8f4ff]">{item.title}</h3>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border flex-shrink-0 ${difficultyColor[item.difficulty] || "text-blue-400/50 bg-blue-900/20 border-blue-900/40"}`}>
                  {item.difficulty}
                </span>
              </div>
              <p className="text-xs text-blue-400/60 mb-2 flex items-start gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
                {item.why_trending}
              </p>
              <p className="text-xs text-[#1e78ff] flex items-start gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {item.tip}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}