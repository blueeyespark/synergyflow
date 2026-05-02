import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, ImageIcon, Radio } from "lucide-react";
import VideoUpload from "@/pages/VideoUpload";
import VideoEditorAdvanced from "./VideoEditorAdvanced";
import MediaLibrary from "@/pages/MediaLibrary";
import AIAssistantHub from "./AIAssistantHub";

const subtabs = [
  { id: "upload", label: "Upload", icon: Upload, component: VideoUpload },
  { id: "editor", label: "Editor", icon: ImageIcon, component: VideoEditorAdvanced },
  { id: "media", label: "Media Library", icon: ImageIcon, component: MediaLibrary },
  { id: "ai", label: "AI Assistant", icon: Radio, component: AIAssistantHub },
];

export default function ProductionHub() {
  const [active, setActive] = useState("upload");
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