import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MessageSquare, CheckCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CollaborationHub() {
  const [active, setActive] = useState("team");
  const teamMembers = [
    { name: "Alex Rivera", role: "Editor", avatar: "AR" },
    { name: "Jordan Tech", role: "Thumbnail Designer", avatar: "JT" },
  ];

  return (
    <div>
      <Tabs value={active} onValueChange={setActive}>
        <TabsList className="mb-6 flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="team" className="gap-2">
            <Users className="w-4 h-4" /> Team
          </TabsTrigger>
          <TabsTrigger value="comments" className="gap-2">
            <MessageSquare className="w-4 h-4" /> Comments
          </TabsTrigger>
          <TabsTrigger value="approvals" className="gap-2">
            <CheckCircle className="w-4 h-4" /> Approvals
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {active === "team" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-[#e8f4ff]">Team Members</h3>
            <Button size="sm" className="gap-1">
              <Users className="w-3 h-3" /> Invite
            </Button>
          </div>
          {teamMembers.map((member, i) => (
            <div key={i} className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1e78ff] to-[#a855f7] flex items-center justify-center text-white font-bold text-sm">
                  {member.avatar}
                </div>
                <div>
                  <p className="font-bold text-[#c8dff5]">{member.name}</p>
                  <p className="text-xs text-blue-400/50">{member.role}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Remove</Button>
            </div>
          ))}
        </div>
      )}

      {active === "comments" && (
        <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-6 text-center">
          <MessageSquare className="w-12 h-12 text-blue-400/30 mx-auto mb-3" />
          <p className="font-bold text-[#c8dff5] mb-1">Video Comments</p>
          <p className="text-sm text-blue-400/40">Collaborate and review videos before publishing</p>
        </div>
      )}

      {active === "approvals" && (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="font-bold text-[#c8dff5]">Video {i} - Awaiting Approval</p>
                <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">Pending</span>
              </div>
              <p className="text-xs text-blue-400/50 mb-3">Assigned to Alex Rivera • Due in 2 days</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">View</Button>
                <Button size="sm" className="flex-1">Approve</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}