import { useState } from "react";
import { Bell, Check, CheckCheck, Trash2, PlaySquare, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

const typeIcons = {
  task_assigned: "📋",
  deadline_approaching: "⏰",
  task_completed: "✅",
  project_update: "📊",
  team_invite: "👥",
  new_video: "🎬",
};

export default function NotificationBell({
  notifications,
  onMarkAsRead,
  onMarkAllRead,
  onDelete,
  newVideos = [],  // { video, channel } pairs from subscribed channels
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("all"); // "all" | "videos"

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const totalBadge = unreadCount + newVideos.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-blue-400 hover:text-blue-200 hover:bg-blue-900/20 border border-blue-900/40">
          <Bell className="w-4 h-4" />
          {totalBadge > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none"
            >
              {totalBadge > 9 ? "9+" : totalBadge}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-[#060d18] border border-blue-900/40 shadow-xl shadow-black/50" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-blue-900/30">
          <h4 className="font-bold text-sm text-[#e8f4ff]">Notifications</h4>
          {unreadCount > 0 && tab === "all" && (
            <button onClick={onMarkAllRead} className="text-xs text-[#1e78ff] hover:text-[#00c8ff] flex items-center gap-1 transition-colors">
              <CheckCheck className="w-3 h-3" /> Mark all read
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-blue-900/30">
          <button onClick={() => setTab("all")}
            className={`flex-1 text-xs font-semibold py-2 transition-colors border-b-2 ${tab === "all" ? "border-[#1e78ff] text-[#1e78ff]" : "border-transparent text-blue-400/50 hover:text-blue-300"}`}>
            All {unreadCount > 0 && <span className="ml-1 bg-[#1e78ff]/20 text-[#1e78ff] text-xs px-1.5 rounded-full">{unreadCount}</span>}
          </button>
          <button onClick={() => setTab("videos")}
            className={`flex-1 text-xs font-semibold py-2 transition-colors border-b-2 ${tab === "videos" ? "border-[#1e78ff] text-[#1e78ff]" : "border-transparent text-blue-400/50 hover:text-blue-300"}`}>
            New Videos {newVideos.length > 0 && <span className="ml-1 bg-red-500/20 text-red-400 text-xs px-1.5 rounded-full">{newVideos.length}</span>}
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* ALL tab */}
            {tab === "all" && (
              <motion.div key="all" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bell className="w-8 h-8 text-blue-400/20 mx-auto mb-2" />
                    <p className="text-sm text-blue-400/40">No notifications</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -80 }}
                      transition={{ delay: index * 0.03 }}
                      className={`px-4 py-3 border-b border-blue-900/20 hover:bg-blue-900/10 transition-colors ${!notification.is_read ? "bg-[#1e78ff]/5" : ""}`}
                    >
                      <div className="flex gap-3">
                        <span className="text-base">{typeIcons[notification.type] || "🔔"}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs ${!notification.is_read ? "font-semibold text-[#e8f4ff]" : "text-blue-300/70"}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-blue-400/40 mt-0.5 line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-blue-400/30 mt-1">
                            {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          {!notification.is_read && (
                            <button onClick={(e) => { e.stopPropagation(); onMarkAsRead(notification.id); }}
                              className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-blue-900/30 transition-colors">
                              <Check className="w-3 h-3 text-blue-400/50" />
                            </button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
                            className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-red-900/30 transition-colors">
                            <Trash2 className="w-3 h-3 text-blue-400/30 hover:text-red-400" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {/* VIDEOS tab */}
            {tab === "videos" && (
              <motion.div key="videos" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {newVideos.length === 0 ? (
                  <div className="p-6 text-center">
                    <PlaySquare className="w-8 h-8 text-blue-400/20 mx-auto mb-2" />
                    <p className="text-sm text-blue-400/40">No new videos from followed channels</p>
                  </div>
                ) : (
                  newVideos.map((item, i) => (
                    <motion.div key={item.video.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="px-4 py-3 border-b border-blue-900/20 hover:bg-blue-900/10 transition-colors">
                      <div className="flex gap-3 items-start">
                        <div className="w-14 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-[#0a1525]">
                          {item.video.thumbnail_url
                            ? <img src={item.video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Video className="w-4 h-4 text-blue-400/30" /></div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#c8dff5] line-clamp-2 leading-snug">{item.video.title}</p>
                          <p className="text-xs text-[#1e78ff] mt-0.5">{item.channel?.channel_name}</p>
                          <p className="text-xs text-blue-400/30 mt-0.5">
                            {formatDistanceToNow(new Date(item.video.created_date), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PopoverContent>
    </Popover>
  );
}