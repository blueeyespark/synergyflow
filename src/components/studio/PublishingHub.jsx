import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Youtube, Twitch } from "lucide-react";
import VideoUpload from "@/pages/VideoUpload";
import YouTubePublisher from "@/pages/YouTubePublisher";
import TwitchStreamer from "@/pages/TwitchStreamer";

const subtabs = [
  { id: "upload", label: "Upload Video", icon: Upload, component: VideoUpload },
  { id: "youtube", label: "YouTube", icon: Youtube, component: YouTubePublisher },
  { id: "twitch", label: "Twitch", icon: Twitch, component: TwitchStreamer },
];

export default function PublishingHub() {
  const [active, setActive] = useState("upload");
  const ActiveComponent = subtabs.find(t => t.id === active)?.component;

  return (
    <div>
      <Tabs value={active} onValueChange={setActive}>
        <TabsList className="mb-6">
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