import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lightbulb, TrendingUp, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const trendingIdeas = [
  "AI-powered content creation tools",
  "Behind-the-scenes workflow videos",
  "Tutorial series: Creator Economy",
  "Top 5 trends in your niche",
  "Collab announcement video",
];

const seoTips = [
  { title: "Use trending keywords in titles", impact: "High" },
  { title: "Create descriptive thumbnails", impact: "High" },
  { title: "Include hashtags (#AI #Creator)", impact: "Medium" },
  { title: "Optimize video description with links", impact: "Medium" },
  { title: "Create compelling hooks (first 3s)", impact: "High" },
];

export default function CreatorResourcesHub() {
  const [active, setActive] = useState("ideas");

  return (
    <div>
      <Tabs value={active} onValueChange={setActive}>
        <TabsList className="mb-6 flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="ideas" className="gap-2">
            <Lightbulb className="w-4 h-4" /> Ideas
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2">
            <Search className="w-4 h-4" /> SEO
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="w-4 h-4" /> Trends
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {active === "ideas" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-[#e8f4ff]">AI-Generated Content Ideas</h3>
            <Button size="sm" className="gap-1">
              <Zap className="w-3 h-3" /> Generate
            </Button>
          </div>
          {trendingIdeas.map((idea, i) => (
            <div key={i} className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4 flex items-center justify-between">
              <p className="text-sm text-[#c8dff5]">{idea}</p>
              <Button size="sm" variant="ghost">Save</Button>
            </div>
          ))}
        </div>
      )}

      {active === "seo" && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#e8f4ff] mb-4">SEO Best Practices</h3>
          {seoTips.map((tip, i) => (
            <div key={i} className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#c8dff5]">{tip.title}</p>
                <span className={`text-xs px-2 py-1 rounded ${tip.impact === "High" ? "bg-green-500/20 text-green-300" : "bg-blue-500/20 text-blue-300"}`}>
                  {tip.impact} Impact
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {active === "trends" && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#e8f4ff] mb-4">Trending in Your Niche</h3>
          <div className="grid grid-cols-2 gap-3">
            {["#ShortForm Video", "#AI Tools", "#Creator Collab", "#Educational Content", "#Behind-the-Scenes", "#Product Reviews"].map((tag, i) => (
              <button key={i} className="bg-[#060d18] border border-blue-900/40 rounded-xl p-3 text-sm font-bold text-[#1e78ff] hover:border-blue-500/60 transition-colors">
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}