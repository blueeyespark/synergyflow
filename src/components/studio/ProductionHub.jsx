import { useState } from "react";
import { Upload, ImageIcon, Zap, Activity } from "lucide-react";
import ContentProductionHub from "./ContentProductionHub";
import MediaLibrary from "@/pages/MediaLibrary";
import AIAssistantHub from "./AIAssistantHub";
import StreamingTechnical from "./StreamingTechnical";

const subtabs = [
  { id: "content", label: "Content", icon: Upload, component: ContentProductionHub },
  { id: "media", label: "Media", icon: ImageIcon, component: MediaLibrary },
  { id: "ai", label: "AI Assistant", icon: Zap, component: AIAssistantHub },
  { id: "live", label: "Live Setup", icon: Activity, component: StreamingTechnical },
];

export default function ProductionHub() {
  const [activeTab, setActiveTab] = useState("content");
  const ActiveComponent = subtabs.find(t => t.id === activeTab)?.component;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-blue-900/30 overflow-x-auto">
        {subtabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 -mb-px transition-all whitespace-nowrap ${
                activeTab === tab.id ? "border-[#1e78ff] text-[#1e78ff]" : "border-transparent text-blue-400/60 hover:text-blue-300"
              }`}>
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>
      {ActiveComponent && <ActiveComponent />}
    </div>
  );
}