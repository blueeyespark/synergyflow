import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Smile } from "lucide-react";

export default function EmotePanel({ channel, user }) {
  const [showPanel, setShowPanel] = useState(false);

  const { data: emotes = [] } = useQuery({
    queryKey: ["emotes", channel?.id],
    queryFn: () => base44.entities.Emote.filter({ channel_id: channel?.id }),
    enabled: !!channel?.id,
  });

  const availableEmotes = emotes.filter(e => {
    if (e.type === "default") return true;
    if (e.type === "subscriber_only" && user) return true; // TODO: check actual subscription
    if (e.type === "vip_only" && user) return true; // TODO: check VIP status
    return false;
  });

  if (!channel || availableEmotes.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
      >
        <Smile className="w-4 h-4" /> Emotes
      </button>

      {showPanel && (
        <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-3 w-64 z-40">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase">Channel Emotes</p>
          <div className="grid grid-cols-6 gap-2">
            {availableEmotes.map(emote => (
              <div key={emote.id} className="flex flex-col items-center gap-1" title={emote.name}>
                <img
                  src={emote.image_url}
                  alt={emote.name}
                  className="w-7 h-7 object-contain hover:scale-125 transition-transform cursor-pointer"
                  onClick={() => {
                    // TODO: Insert emote into chat input
                    navigator.clipboard.writeText(emote.name);
                  }}
                />
                <span className="text-xs text-slate-500 dark:text-slate-400 text-center truncate w-full">
                  {emote.name}
                </span>
              </div>
            ))}
          </div>
          {emotes.some(e => e.type !== "default") && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              Some emotes available with subscription
            </p>
          )}
        </div>
      )}
    </div>
  );
}