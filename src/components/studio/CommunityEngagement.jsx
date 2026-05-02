import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Users, Heart, TrendingUp, Zap } from "lucide-react";

export default function CommunityEngagement() {
  const [user, setUser] = useState(null);
  useState(() => { base44.auth.me().then(setUser); }, []);

  const { data: comments = [] } = useQuery({
    queryKey: ["community-comments"],
    queryFn: () => base44.entities.VideoComment.list("-created_date", 30),
  });

  const { data: superChats = [] } = useQuery({
    queryKey: ["super-chats"],
    queryFn: () => base44.entities.SuperChat.list("-created_date", 20),
  });

  const totalEngagement = comments.length + superChats.length;
  const avgSentiment = "positive";

  const engagementMetrics = [
    { label: "Total Comments", value: comments.length, icon: MessageCircle, color: "text-blue-400" },
    { label: "Super Chats", value: superChats.length, icon: Zap, color: "text-yellow-400" },
    { label: "Community Size", value: "2.4K", icon: Users, color: "text-purple-400" },
    { label: "Engagement Rate", value: "8.2%", icon: Heart, color: "text-red-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {engagementMetrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${m.color}`} />
                <span className="text-xs text-blue-400/60">{m.label}</span>
              </div>
              <p className="text-2xl font-black text-[#e8f4ff]">{m.value}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Comments */}
      <section>
        <h2 className="text-xl font-black text-[#e8f4ff] mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Recent Comments ({comments.length})
        </h2>
        <div className="space-y-3">
          {comments.slice(0, 8).map(c => (
            <div key={c.id} className="p-3 bg-[#060d18] border border-blue-900/40 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1e78ff] to-[#a855f7] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {c.author_name?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#c8dff5]">{c.author_name}</p>
                  <p className="text-sm text-blue-400/80 mt-1 break-words">{c.content}</p>
                  <p className="text-xs text-blue-400/40 mt-2">👍 {c.likes || 0} likes</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Super Chat Donations */}
      <section>
        <h2 className="text-xl font-black text-[#e8f4ff] mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Super Chat Donations ({superChats.length})
        </h2>
        <div className="space-y-2">
          {superChats.slice(0, 8).map(sc => (
            <div key={sc.id} className="p-3 bg-[#060d18] border border-blue-900/40 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: sc.color || "#fbbf24" }} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#c8dff5] truncate">{sc.sender_name}</p>
                  <p className="text-xs text-blue-400/60 truncate">{sc.message}</p>
                </div>
              </div>
              <span className="text-sm font-bold text-yellow-400 flex-shrink-0">${sc.amount}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Engagement Tips */}
      <section>
        <h2 className="text-xl font-black text-[#e8f4ff] mb-4">Community Growth Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { title: "Respond to Comments", desc: "Reply within 24 hours to boost engagement" },
            { title: "Host Community Events", desc: "Weekly streams or Q&A sessions" },
            { title: "Pin Important Messages", desc: "Highlight valuable community content" },
            { title: "Create Discord Server", desc: "Build a dedicated community space" },
          ].map((tip, i) => (
            <div key={i} className="p-4 bg-[#060d18] border border-blue-900/40 rounded-xl">
              <p className="text-sm font-bold text-[#e8f4ff] mb-1">{tip.title}</p>
              <p className="text-xs text-blue-400/60">{tip.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}