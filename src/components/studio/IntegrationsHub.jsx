import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Youtube, MessageSquare, Zap, Globe } from "lucide-react";
import YouTubePublisher from "@/pages/YouTubePublisher";
import TwitchStreamer from "@/pages/TwitchStreamer";

const subtabs = [
  { id: "youtube", label: "YouTube", icon: Youtube, component: YouTubePublisher },
  { id: "twitch", label: "Twitch", icon: Zap, component: TwitchStreamer },
  {
    id: "tiktok",
    label: "TikTok",
    icon: MessageSquare,
    component: () => (
      <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-8 text-center">
        <p className="text-blue-400/40 mb-2">TikTok Integration</p>
        <p className="text-xs text-blue-400/30">Connect and auto-publish to TikTok coming soon</p>
      </div>
    ),
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: Globe,
    component: () => (
      <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-8 text-center">
        <p className="text-blue-400/40 mb-2">Instagram Integration</p>
        <p className="text-xs text-blue-400/30">Cross-post to Instagram Reels coming soon</p>
      </div>
    ),
  },
];

export default function IntegrationsHub() {
  const [active, setActive] = useState("youtube");
  const ActiveComponent = subtabs.find(t => t.id === active)?.component;

  return (
    <div>
      <Tabs value={active} onValueChange={setActive}>
        <TabsList className="mb-6 flex flex-wrap gap-1 h-auto">
          {subtabs.map(t => (
            <TabsTrigger key={t.id} value={t.id} className="gap-2">
              <t.icon className="w-4 h-4" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div>{ActiveComponent && <ActiveComponent />}</div>
      </Tabs>
    </div>
  );
}