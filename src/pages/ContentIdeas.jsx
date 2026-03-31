import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Lightbulb, Loader2, Copy, Save, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function ContentIdeas() {
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState("blog_post");
  const [platform, setPlatform] = useState("all");
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedIdeas, setSavedIdeas] = useState([]);

  const generateIdeas = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 5 creative ${contentType.replace(/_/g, " ")} content ideas for the topic: "${topic}". 
        Target platform: ${platform === "all" ? "all platforms" : platform}.
        
        For each idea, provide:
        1. Title
        2. Key points/outline (3-4 bullets)
        3. Best platform fit
        4. Target audience
        5. Expected engagement level (low/medium/high)
        
        Format as JSON array with objects containing: title, outline, platform, audience, engagement.`,
        response_json_schema: {
          type: "object",
          properties: {
            ideas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  outline: { type: "array", items: { type: "string" } },
                  platform: { type: "string" },
                  audience: { type: "string" },
                  engagement: { type: "string" }
                }
              }
            }
          }
        }
      });

      setIdeas(response.ideas || []);
      toast.success("Ideas generated!");
    } catch (error) {
      toast.error("Failed to generate ideas");
    } finally {
      setLoading(false);
    }
  };

  const saveIdea = (idea) => {
    setSavedIdeas([...savedIdeas, { ...idea, id: Date.now() }]);
    toast.success("Idea saved to your library!");
  };

  const deleteIdea = (id) => {
    setSavedIdeas(savedIdeas.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Generator */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Generate Content Ideas
        </h3>

        <div className="space-y-4">
          <Input
            placeholder="Enter your topic or keyword..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && generateIdeas()}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blog_post">Blog Post</SelectItem>
                <SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="video_script">Video Script</SelectItem>
                <SelectItem value="newsletter">Newsletter</SelectItem>
                <SelectItem value="listicle">Listicle</SelectItem>
              </SelectContent>
            </Select>

            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={generateIdeas} disabled={loading} className="w-full gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
            {loading ? "Generating..." : "Generate Ideas"}
          </Button>
        </div>
      </div>

      {/* Generated Ideas */}
      {ideas.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Generated Ideas</h3>
          {ideas.map((idea, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">{idea.title}</h4>
                  <div className="space-y-2 mb-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-semibold">Outline:</span>
                    </p>
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 ml-4 list-disc">
                      {(idea.outline || []).map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 px-2 py-1 rounded">
                      {idea.platform}
                    </span>
                    <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 px-2 py-1 rounded">
                      {idea.engagement} engagement
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => saveIdea(idea)}
                    className="text-slate-600 dark:text-slate-400"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Saved Ideas */}
      {savedIdeas.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Saved Ideas</h3>
          {savedIdeas.map((idea) => (
            <motion.div
              key={idea.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 dark:text-white">{idea.title}</h4>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteIdea(idea.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}