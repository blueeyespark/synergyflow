import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Lightbulb, FileText, MessageSquare } from "lucide-react";
import ContentCalendar from "@/pages/ContentCalendar";
import ContentIdeas from "@/pages/ContentIdeas";
import Blog from "@/pages/Blog";
import SocialMedia from "@/pages/SocialMedia";

const subtabs = [
  { id: "calendar", label: "Calendar", icon: Calendar, component: ContentCalendar },
  { id: "ideas", label: "Ideas", icon: Lightbulb, component: ContentIdeas },
  { id: "blog", label: "Blog", icon: FileText, component: Blog },
  { id: "social", label: "Social Media", icon: MessageSquare, component: SocialMedia },
];

export default function ContentHub() {
  const [active, setActive] = useState("calendar");
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