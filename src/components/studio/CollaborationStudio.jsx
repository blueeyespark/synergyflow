import { useState } from "react";
import { Users, MessageSquare, Calendar, Plus, X, Link as LinkIcon } from "lucide-react";

export default function CollaborationStudio() {
  const [collaborations, setCollaborations] = useState([
    { id: 1, creator: "StreamerB", status: "confirmed", date: "2026-05-10", type: "collab_stream", platform: "Twitch" },
    { id: 2, creator: "ContentMaster", status: "pending", date: "2026-05-15", type: "video_collab", platform: "YouTube" },
    { id: 3, creator: "CreativeX", status: "completed", date: "2026-04-25", type: "collab_stream", platform: "Kick" },
  ]);

  const collaborationIdeas = [
    { title: "Gaming Challenge", tags: ["gaming", "competitive"], interest: "high" },
    { title: "Reaction Series", tags: ["reaction", "entertainment"], interest: "medium" },
    { title: "Tech Review Roundtable", tags: ["tech", "review"], interest: "medium" },
  ];

  return (
    <div className="space-y-6">
      {/* Collaboration Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Active Collabs", value: collaborations.filter(c => c.status === "confirmed").length, color: "text-green-400" },
          { label: "Pending Invites", value: collaborations.filter(c => c.status === "pending").length, color: "text-yellow-400" },
          { label: "Completed", value: collaborations.filter(c => c.status === "completed").length, color: "text-blue-400" },
          { label: "Total Views (collabs)", value: "142K", color: "text-purple-400" },
        ].map((stat, i) => (
          <div key={i} className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4">
            <p className="text-xs text-blue-400/60 mb-1">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Active Collaborations */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-[#e8f4ff] flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Collaborations
          </h2>
          <button className="flex items-center gap-2 bg-[#1e78ff] hover:bg-[#3d8fff] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Find Creator
          </button>
        </div>

        <div className="space-y-3">
          {collaborations.map(c => (
            <div key={c.id} className="bg-[#060d18] border border-blue-900/40 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-[#e8f4ff]">{c.creator}</p>
                  <p className="text-xs text-blue-400/60 mt-1">{c.type.replace(/_/g, " ")} • {c.platform}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  c.status === "confirmed" ? "bg-green-500/20 text-green-400" :
                  c.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-slate-500/20 text-slate-400"
                }`}>
                  {c.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-blue-400/60 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {c.date}
                </p>
                {c.status === "pending" && (
                  <div className="flex gap-2">
                    <button className="text-xs bg-green-500/20 text-green-300 hover:bg-green-500/40 px-3 py-1.5 rounded-lg transition-colors font-semibold">
                      Accept
                    </button>
                    <button className="text-xs bg-red-500/20 text-red-300 hover:bg-red-500/40 px-3 py-1.5 rounded-lg transition-colors font-semibold">
                      Decline
                    </button>
                  </div>
                )}
                {c.status === "confirmed" && (
                  <button className="text-xs bg-blue-900/20 text-blue-300 hover:bg-blue-900/40 px-3 py-1.5 rounded-lg transition-colors font-semibold">
                    Manage
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Collaboration Ideas Board */}
      <section>
        <h2 className="text-xl font-black text-[#e8f4ff] mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Collaboration Ideas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {collaborationIdeas.map((idea, i) => (
            <div key={i} className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4 cursor-pointer hover:border-[#1e78ff]/40 transition-colors">
              <p className="text-sm font-bold text-[#e8f4ff] mb-2">{idea.title}</p>
              <div className="flex gap-1.5 mb-3 flex-wrap">
                {idea.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-1 bg-blue-900/20 text-blue-300 rounded">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${
                  idea.interest === "high" ? "text-green-400" :
                  idea.interest === "medium" ? "text-yellow-400" :
                  "text-slate-400"
                }`}>
                  {idea.interest} interest
                </span>
                <button className="text-xs bg-[#1e78ff] hover:bg-[#3d8fff] text-white px-2 py-1 rounded transition-colors font-semibold">
                  Pitch
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Creator Network */}
      <section>
        <h2 className="text-xl font-black text-[#e8f4ff] mb-4">Collaboration Network</h2>
        <div className="space-y-2">
          {[
            { name: "StreamerA", channel: "85K subs", overlap: "35% audience", lastCollab: "3 months ago" },
            { name: "CreatorY", channel: "120K subs", overlap: "28% audience", lastCollab: "6 months ago" },
            { name: "GamerZ", channel: "45K subs", overlap: "62% audience", lastCollab: "1 month ago" },
          ].map((creator, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-[#060d18] border border-blue-900/40 rounded-lg">
              <div>
                <p className="text-sm font-semibold text-[#c8dff5]">{creator.name}</p>
                <p className="text-xs text-blue-400/60 mt-0.5">{creator.channel} • {creator.overlap} overlap</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-blue-400/50">{creator.lastCollab}</span>
                <button className="text-xs bg-[#1e78ff] hover:bg-[#3d8fff] text-white px-3 py-1.5 rounded-lg transition-colors font-semibold">
                  Collaborate
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Collaboration Resources */}
      <section>
        <h2 className="text-xl font-black text-[#e8f4ff] mb-4 flex items-center gap-2">
          <LinkIcon className="w-5 h-5" />
          Resources
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { title: "Collab Contract Template", desc: "Legal agreement template" },
            { title: "Setup Guide", desc: "Multi-stream setup instructions" },
            { title: "Promotion Checklist", desc: "Pre-collab promotion tasks" },
            { title: "Analytics Dashboard", desc: "Track collab performance" },
          ].map((res, i) => (
            <div key={i} className="p-3 bg-[#060d18] border border-blue-900/40 rounded-lg cursor-pointer hover:border-[#1e78ff]/40 transition-colors">
              <p className="text-sm font-semibold text-[#e8f4ff]">{res.title}</p>
              <p className="text-xs text-blue-400/60 mt-1">{res.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}