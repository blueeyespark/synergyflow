import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Video, ImageIcon, Radio, Youtube, Twitch } from "lucide-react";
import VideoUpload from "@/pages/VideoUpload";
import YouTubePublisher from "@/pages/YouTubePublisher";
import TwitchStreamer from "@/pages/TwitchStreamer";
import VideoEditor from "@/pages/VideoEditor";
import ThumbnailMaker from "@/pages/ThumbnailMaker";
import IntroOutroMaker from "@/pages/IntroOutroMaker";

const subtabs = [
  { id: "upload", label: "Upload Video", icon: Upload, component: VideoUpload },
  { id: "youtube", label: "YouTube", icon: Youtube, component: YouTubePublisher },
  { id: "twitch", label: "Twitch", icon: Twitch, component: TwitchStreamer },
  { id: "editor", label: "Video Editor", icon: Video, component: VideoEditor },
  { id: "thumbnail", label: "Thumbnail Maker", icon: ImageIcon, component: ThumbnailMaker },
  { id: "intro", label: "Intro/Outro", icon: Radio, component: IntroOutroMaker },
];

export default function ContentProductionHub() {
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