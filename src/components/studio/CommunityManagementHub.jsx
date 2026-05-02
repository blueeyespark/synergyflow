import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Shield, Users, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

const recentComments = [
  { author: "CreativeVibes", text: "Amazing video! Love the production quality 🔥", likes: 24 },
  { author: "TechEnthusiast", text: "When's the next tutorial dropping?", likes: 8 },
  { author: "SpamBot123", text: "Check out my channel!!!", likes: 0, spam: true },
];

export default function CommunityManagementHub() {
  const [active, setActive] = useState("comments");

  return (
    <div>
      <Tabs value={active} onValueChange={setActive}>
        <TabsList className="mb-6 flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="comments" className="gap-2">
            <MessageCircle className="w-4 h-4" /> Comments
          </TabsTrigger>
          <TabsTrigger value="moderation" className="gap-2">
            <Shield className="w-4 h-4" /> Moderation
          </TabsTrigger>
          <TabsTrigger value="engagement" className="gap-2">
            <Activity className="w-4 h-4" /> Engagement
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {active === "comments" && (
        <div className="space-y-3">
          {recentComments.map((comment, i) => (
            <div key={i} className={`bg-[#060d18] border rounded-xl p-4 ${comment.spam ? "border-red-900/40" : "border-blue-900/40"}`}>
              <div className="flex items-start justify-between mb-2">
                <p className="font-bold text-[#c8dff5]">{comment.author}</p>
                {comment.spam && <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">Spam</span>}
              </div>
              <p className="text-sm text-blue-400/70 mb-3">{comment.text}</p>
              <div className="flex gap-2">
                <button className="text-xs text-blue-400/50 hover:text-blue-300">👍 {comment.likes}</button>
                <Button size="sm" variant="ghost" className="ml-auto text-xs">Reply</Button>
                {comment.spam && <Button size="sm" variant="ghost" className="text-xs text-red-400">Block</Button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {active === "moderation" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-[#22c55e]">98%</p>
              <p className="text-xs text-blue-400/40 mt-1">Approval Rate</p>
            </div>
            <div className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-[#f97316]">3</p>
              <p className="text-xs text-blue-400/40 mt-1">Spam Blocked Today</p>
            </div>
          </div>
          <div className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4">
            <p className="text-sm font-bold text-[#e8f4ff] mb-3">Auto-Moderation Rules</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm text-blue-400/70">Block spam links</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="rounded" />
                <span className="text-sm text-blue-400/70">Block profanity</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm text-blue-400/70">Require comment approval</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {active === "engagement" && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4 text-center">
              <p className="text-xl font-black text-[#1e78ff]">847</p>
              <p className="text-xs text-blue-400/40 mt-1">Total Comments</p>
            </div>
            <div className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4 text-center">
              <p className="text-xl font-black text-[#a855f7]">3.2K</p>
              <p className="text-xs text-blue-400/40 mt-1">Total Likes</p>
            </div>
            <div className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4 text-center">
              <p className="text-xl font-black text-[#22c55e]">4.5%</p>
              <p className="text-xs text-blue-400/40 mt-1">Engagement Rate</p>
            </div>
          </div>
          <div className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4">
            <p className="text-sm font-bold text-[#e8f4ff] mb-3">Community Health</p>
            <p className="text-sm text-blue-400/70 mb-3">Your community is thriving! Keep up the great engagement with your audience.</p>
            <Button className="w-full gap-2">
              <Users className="w-4 h-4" /> Foster Engagement
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}