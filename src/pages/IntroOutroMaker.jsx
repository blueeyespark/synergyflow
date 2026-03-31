import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Download, Eye, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const templates = [
  { id: 1, name: "Cinematic", bg: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", textColor: "#fff", animation: "slide" },
  { id: 2, name: "Neon", bg: "linear-gradient(135deg, #0f0f1e 0%, #1a0033 100%)", textColor: "#00ffff", animation: "fade" },
  { id: 3, name: "Sunset", bg: "linear-gradient(135deg, #ff6b00 0%, #ff0066 100%)", textColor: "#fff", animation: "zoom" },
  { id: 4, name: "Minimal", bg: "#ffffff", textColor: "#000", animation: "slide" },
  { id: 5, name: "Gaming", bg: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)", textColor: "#00ff00", animation: "bounce" },
];

export default function IntroOutroMaker() {
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [introText, setIntroText] = useState("Your Channel");
  const [outroText, setOutroText] = useState("Thanks for Watching!");
  const [duration, setDuration] = useState(3);
  const [fontSize, setFontSize] = useState(48);

  const handleDownload = (type) => {
    toast.success(`${type === "intro" ? "Intro" : "Outro"} generated! Ready for download.`);
  };

  const getAnimationClass = () => {
    const animations = {
      slide: "translate-x-[-100%] animate-[slideIn_0.8s_ease-out_forwards]",
      fade: "opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]",
      zoom: "scale-0 animate-[zoomIn_0.8s_ease-out_forwards]",
      bounce: "translate-y-[50px] animate-[bounceIn_0.8s_ease-out_forwards]",
    };
    return animations[selectedTemplate.animation] || "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-slate-900">Intro/Outro Maker</h1>
          <p className="text-slate-500 mt-1">Create stunning intros and outros for your videos</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Preview */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="space-y-4 p-6">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Preview
                </h3>

                {/* Intro Preview */}
                <div
                  className="aspect-video rounded-xl flex items-center justify-center overflow-hidden relative"
                  style={{ background: selectedTemplate.bg }}
                >
                  <div className={`text-center ${getAnimationClass()}`}>
                    <p className="text-sm font-medium text-slate-400 mb-2">INTRO</p>
                    <p style={{ fontSize: `${fontSize}px`, color: selectedTemplate.textColor }} className="font-black">
                      {introText}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownload("intro")}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 gap-2"
                  >
                    <Download className="w-4 h-4" /> Download Intro
                  </Button>
                </div>

                {/* Outro Preview */}
                <div
                  className="aspect-video rounded-xl flex items-center justify-center overflow-hidden relative"
                  style={{ background: selectedTemplate.bg }}
                >
                  <div className={`text-center ${getAnimationClass()}`}>
                    <p className="text-sm font-medium text-slate-400 mb-2">OUTRO</p>
                    <p style={{ fontSize: `${fontSize}px`, color: selectedTemplate.textColor }} className="font-black">
                      {outroText}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownload("outro")}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 gap-2"
                  >
                    <Download className="w-4 h-4" /> Download Outro
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <h3 className="font-semibold text-slate-900 mb-4">Templates</h3>
              <div className="grid grid-cols-2 gap-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedTemplate.id === t.id ? "border-cyan-500 bg-cyan-50" : "border-slate-200 hover:border-slate-300"
                    }`}
                    style={{ background: selectedTemplate.id === t.id ? undefined : "white" }}
                  >
                    <div
                      className="w-full h-8 rounded mb-1"
                      style={{
                        background: t.bg,
                        border: `1px solid ${t.textColor === "#fff" ? "#ccc" : "#f0f0f0"}`,
                      }}
                    />
                    <p className="text-xs font-medium text-slate-700">{t.name}</p>
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Type className="w-4 h-4" /> Text
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-2">Intro Text</label>
                  <Input
                    value={introText}
                    onChange={(e) => setIntroText(e.target.value)}
                    placeholder="Your Channel"
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-2">Outro Text</label>
                  <Input
                    value={outroText}
                    onChange={(e) => setOutroText(e.target.value)}
                    placeholder="Thanks for Watching!"
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-2">Font Size: {fontSize}px</label>
                  <input type="range" min="24" max="72" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-2">Duration: {duration}s</label>
                  <input type="range" min="1" max="10" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="w-full" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}