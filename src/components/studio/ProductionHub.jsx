import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, Edit3 } from "lucide-react";
import VideoUpload from "@/pages/VideoUpload";
import AdvancedVideoEditor from "./AdvancedVideoEditor";

export default function ProductionHub() {
  const [activeTab, setActiveTab] = useState("upload");

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="w-4 h-4" /> Upload
          </TabsTrigger>
          <TabsTrigger value="editor" className="gap-2">
            <Edit3 className="w-4 h-4" /> Advanced Editor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <VideoUpload />
        </TabsContent>

        <TabsContent value="editor" className="mt-0">
          <AdvancedVideoEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}