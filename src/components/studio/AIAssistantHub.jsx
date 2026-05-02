import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";

export default function AIAssistantHub() {
  const [selectedTool, setSelectedTool] = useState("titles");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const tools = {
    titles: {
      label: "Title Generator",
      desc: "Generate SEO-optimized video titles",
      prompt: (input) => `Generate 5 catchy, SEO-optimized YouTube video titles for: "${input}". Make them engaging and clickable.`
    },
    descriptions: {
      label: "Description Writer",
      desc: "Create engaging video descriptions",
      prompt: (input) => `Write a professional, engaging YouTube video description for a video about: "${input}". Include hooks and CTAs.`
    },
    tags: {
      label: "Tag Suggester",
      desc: "Find relevant tags for discovery",
      prompt: (input) => `Suggest 15 relevant YouTube tags for a video about "${input}". Return as comma-separated list.`
    },
    thumbnails: {
      label: "Thumbnail Ideas",
      desc: "Get thumbnail design suggestions",
      prompt: (input) => `Suggest 3 compelling YouTube thumbnail design ideas for: "${input}". Include color schemes and layout suggestions.`
    }
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: tools[selectedTool].prompt(input),
        add_context_from_internet: false
      });
      setOutput(result);
    } catch (error) {
      setOutput("Error generating content. Please try again.");
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a855f7] to-[#1e78ff] flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#e8f4ff]">AI Assistant Hub</h2>
          <p className="text-xs text-blue-400/50">Generate content ideas powered by AI</p>
        </div>
      </div>

      {/* Tool selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {Object.entries(tools).map(([key, tool]) => (
          <button
            key={key}
            onClick={() => { setSelectedTool(key); setOutput(""); setInput(""); }}
            className={`p-3 rounded-xl border transition-all text-left ${
              selectedTool === key
                ? "bg-[#1e78ff]/20 border-[#1e78ff]/50 text-[#1e78ff]"
                : "bg-[#0a1525] border-blue-900/30 text-blue-400/60 hover:border-blue-900/50"
            }`}
          >
            <p className="text-xs font-bold">{tool.label}</p>
            <p className="text-[10px] opacity-70">{tool.desc}</p>
          </button>
        ))}
      </div>

      {/* Input and output */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-blue-400/60 uppercase">Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Enter your ${tools[selectedTool].label.toLowerCase()}...`}
            className="w-full h-32 bg-[#0a1525] border border-blue-900/30 rounded-xl p-3 text-sm text-[#c8dff5] placeholder-blue-400/20 outline-none focus:border-[#1e78ff]/50 resize-none"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !input.trim()}
            className="w-full bg-[#1e78ff] hover:bg-[#1e78ff]/90 disabled:opacity-50 text-white text-sm font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-blue-400/60 uppercase">Output</label>
          <div className="w-full h-32 bg-[#0a1525] border border-blue-900/30 rounded-xl p-3 text-sm text-[#c8dff5] overflow-y-auto">
            {output ? <p className="whitespace-pre-wrap">{output}</p> : <p className="text-blue-400/20">Results will appear here...</p>}
          </div>
          {output && (
            <button
              onClick={copyToClipboard}
              className="w-full bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 text-sm font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Output"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}