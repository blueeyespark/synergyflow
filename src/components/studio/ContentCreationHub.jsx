import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Zap, Wand2, Music, Layers } from "lucide-react";
import VideoEditor from "@/pages/VideoEditor";
import ThumbnailMaker from "@/pages/ThumbnailMaker";
import IntroOutroMaker from "@/pages/IntroOutroMaker";

const subtabs = [
  { id: "editor", label: "Video Editor", icon: Zap, component: VideoEditor },
  { id: "thumbnail", label: "Thumbnails", icon: Palette, component: ThumbnailMaker },
  { id: "intros", label: "Intros/Outros", icon: Wand2, component: IntroOutroMaker },
  {
    id: "effects",
    label: "Effects",
    icon: Layers,
    component: () => (
      <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-6 text-center">
        <p className="text-blue-400/40">Effects library coming soon</p>
      </div>
    ),
  },
  {
    id: "music",
    label: "Audio Library",
    icon: Music,
    component: () => (
      <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-6 text-center">
        <p className="text-blue-400/40">Royalty-free music library coming soon</p>
      </div>
    ),
  },
];

export default function ContentCreationHub() {
  const [active, setActive] = useState("editor");
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