import { useState } from "react";
import { Sparkles, Wand2, Tags, PenTool, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const tones = [
  { value: "professional", label: "Professional", desc: "Business-appropriate, authoritative" },
  { value: "casual", label: "Casual", desc: "Relaxed, conversational" },
  { value: "friendly", label: "Friendly", desc: "Warm, approachable" },
  { value: "formal", label: "Formal", desc: "Traditional, serious" },
  { value: "persuasive", label: "Persuasive", desc: "Compelling, action-oriented" },
];

export default function AIBlogAssistant({ onGeneratePost, onChangeTone, onGenerateMeta, currentTone, loading }) {
  const [topic, setTopic] = useState("");

  return (
    <div className="mt-6 space-y-6">
      {/* Generate from Topic */}
      <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <PenTool className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h4 className="font-medium text-slate-900">Write from Scratch</h4>
            <p className="text-xs text-slate-500">Generate a full blog post from a topic</p>
          </div>
        </div>
        <Textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="E.g., 'Benefits of remote work for startups' or '10 tips for better productivity'"
          rows={3}
          className="mb-3"
        />
        <Button 
          onClick={() => onGeneratePost(topic)} 
          disabled={loading || !topic.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Generate Blog Post
        </Button>
      </div>

      {/* Change Tone */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Wand2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h4 className="font-medium text-slate-900">Change Tone</h4>
            <p className="text-xs text-slate-500">Rewrite content in a different style</p>
          </div>
        </div>
        <div className="space-y-2">
          {tones.map(tone => (
            <button
              key={tone.value}
              onClick={() => onChangeTone(tone.value)}
              disabled={loading || currentTone === tone.value}
              className={`w-full p-3 rounded-lg text-left transition-all ${
                currentTone === tone.value 
                  ? 'bg-indigo-100 border-2 border-indigo-300' 
                  : 'bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <p className="font-medium text-sm text-slate-900">{tone.label}</p>
              <p className="text-xs text-slate-500">{tone.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Generate Tags & Meta */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Tags className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h4 className="font-medium text-slate-900">Tags & SEO</h4>
            <p className="text-xs text-slate-500">Auto-generate tags and metadata</p>
          </div>
        </div>
        <Button 
          onClick={onGenerateMeta} 
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Tags className="w-4 h-4 mr-2" />}
          Generate Tags & Metadata
        </Button>
      </div>

      {/* Tips */}
      <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
        <h4 className="font-medium text-amber-900 mb-2">✨ Tips</h4>
        <ul className="text-xs text-amber-800 space-y-1">
          <li>• Be specific with topics for better results</li>
          <li>• Edit generated content to add your voice</li>
          <li>• Use tone changes to match your audience</li>
        </ul>
      </div>
    </div>
  );
}