import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, ImageIcon } from "lucide-react";
import VideoUpload from "@/pages/VideoUpload";
import VideoEditorAdvanced from "./VideoEditorAdvanced";

const subtabs = [
  { id: "upload", label: "Upload", icon: Upload, component: VideoUpload },
  { id: "editor", label: "Editor", icon: ImageIcon, component: VideoEditorAdvanced },
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