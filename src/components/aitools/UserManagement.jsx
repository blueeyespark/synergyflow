import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, AlertTriangle, MoreVertical, Ban, Zap, Eye, Mail, Calendar, Shield, Tv, Video, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UserManagement({ user: currentUser }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [strikeCount, setStrikeCount] = useState(0);
  const qc = useQueryClient();

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users-all"],
    queryFn: () => base44.entities.User.list(),
    enabled: !!currentUser?.email,
  });

  const { data: channels = [] } = useQuery({
    queryKey: ["channels-all"],
    queryFn: () => base44.entities.Channel.list(),
  });

  const { data: videos = [] } = useQuery({
    queryKey: ["videos-all"],
    queryFn: () => base44.entities.Video.list(),
  });

  // Filter users by search
  const filteredUsers = allUsers.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected user's stats
  const userChannels = selectedUser ? channels.filter(c => c.creator_email === selectedUser.email) : [];
  const userVideos = selectedUser ? videos.filter(v => userChannels.map(c => c.id).includes(v.channel_id)) : [];

  // Mutations for admin actions
  const banMutation = useMutation({
    mutationFn: () => base44.entities.User.update(selectedUser.id, { role: "banned" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users-all"] }); setSelectedUser(null); },
  });

  const demonetizeMutation = useMutation({
    mutationFn: (videoId) => base44.entities.Video.update(videoId, { monetization_enabled: false }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["videos-all"] }),
  });

  const updateStrikesMutation = useMutation({
    mutationFn: () => {
      const newStrikes = (selectedUser.strikes || 0) + 1;
      if (newStrikes >= 3) {
        return base44.entities.User.update(selectedUser.id, { role: "banned", strikes: newStrikes });
      }
      return base44.entities.User.update(selectedUser.id, { strikes: newStrikes });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users-all"] }); },
  });

  const unrestrict = useMutation({
    mutationFn: () => base44.entities.User.update(selectedUser.id, { role: "user", strikes: 0 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users-all"] }); setSelectedUser(null); },
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User List */}
        <div className="lg:col-span-1 bg-[#060d18] border border-blue-900/40 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-blue-900/30">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-blue-400/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full bg-[#0a1525] border border-blue-900/40 rounded-xl pl-10 pr-3 py-2 text-xs text-[#c8dff5] placeholder-blue-400/30 outline-none focus:border-[#1e78ff]/50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 p-2">
            {filteredUsers.length === 0 ? (
              <p className="text-xs text-blue-400/30 text-center py-4">No users found</p>
            ) : (
              filteredUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors border ${
                    selectedUser?.id === u.id
                      ? "bg-[#1e78ff]/20 border-[#1e78ff]/40 text-[#1e78ff]"
                      : "border-transparent hover:bg-blue-900/20 text-blue-300/70 hover:text-blue-200"
                  }`}
                >
                  <p className="text-xs font-semibold truncate">{u.full_name || "User"}</p>
                  <p className="text-xs text-blue-400/50 truncate">{u.email}</p>
                  {u.role === "banned" && <span className="text-xs text-red-400 font-bold">BANNED</span>}
                  {u.strikes > 0 && <span className="text-xs text-orange-400">⚠️ {u.strikes} strikes</span>}
                </button>
              ))
            )}
          </div>
        </div>

        {/* User Details & Actions */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Header */}
              <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#e8f4ff]">{selectedUser.full_name || "User"}</h3>
                    <p className="text-sm text-blue-400/50 mt-1">{selectedUser.email}</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    selectedUser.role === "admin" ? "bg-purple-900/20 text-purple-400" :
                    selectedUser.role === "banned" ? "bg-red-900/20 text-red-400" :
                    "bg-blue-900/20 text-blue-400"
                  }`}>
                    {selectedUser.role?.toUpperCase() || "USER"}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-[#0a1525] border border-blue-900/30 rounded-xl p-3">
                    <p className="text-xs text-blue-400/50">Channels</p>
                    <p className="text-lg font-bold text-[#e8f4ff]">{userChannels.length}</p>
                  </div>
                  <div className="bg-[#0a1525] border border-blue-900/30 rounded-xl p-3">
                    <p className="text-xs text-blue-400/50">Videos</p>
                    <p className="text-lg font-bold text-[#e8f4ff]">{userVideos.length}</p>
                  </div>
                  <div className="bg-[#0a1525] border border-blue-900/30 rounded-xl p-3">
                    <p className="text-xs text-blue-400/50">Strikes</p>
                    <p className="text-lg font-bold text-orange-400">{selectedUser.strikes || 0}/3</p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="space-y-2 text-xs text-blue-400/50 border-t border-blue-900/30 pt-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Joined {new Date(selectedUser.created_date).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Videos List */}
              {userVideos.length > 0 && (
                <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-5">
                  <h4 className="text-sm font-bold text-[#e8f4ff] mb-3 flex items-center gap-2">
                    <Video className="w-4 h-4" /> Videos
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {userVideos.map(v => (
                      <div key={v.id} className="bg-[#0a1525] border border-blue-900/30 rounded-lg p-3 flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#c8dff5] truncate">{v.title}</p>
                          <p className="text-xs text-blue-400/40">{v.view_count || 0} views</p>
                        </div>
                        {v.monetization_enabled ? (
                          <button
                            onClick={() => demonetizeMutation.mutate(v.id)}
                            className="ml-2 px-2 py-1 bg-red-900/20 hover:bg-red-900/30 text-red-400 text-xs font-bold rounded-lg transition-colors"
                            title="Demonetize for TOS violation"
                          >
                            Demonetize
                          </button>
                        ) : (
                          <span className="ml-2 px-2 py-1 bg-gray-900/20 text-gray-400 text-xs font-bold rounded-lg">Demonetized</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              <div className="bg-red-900/10 border border-red-900/30 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Moderation Actions
                </h4>
                <div className="space-y-2">
                  {selectedUser.role !== "banned" ? (
                    <>
                      <Button
                        onClick={() => updateStrikesMutation.mutate()}
                        disabled={updateStrikesMutation.isPending}
                        variant="outline"
                        className="w-full gap-2 text-orange-400 border-orange-900/30 hover:bg-orange-900/20"
                      >
                        <Zap className="w-4 h-4" /> Add Strike ({selectedUser.strikes || 0}/3)
                      </Button>
                      {(selectedUser.strikes || 0) >= 2 && (
                        <p className="text-xs text-orange-400/70 px-2">One more strike will result in permanent ban</p>
                      )}
                      <Button
                        onClick={() => banMutation.mutate()}
                        disabled={banMutation.isPending}
                        className="w-full gap-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border-red-900/40"
                      >
                        <Ban className="w-4 h-4" /> Ban Account
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => unrestrict.mutate()}
                      disabled={unrestrict.isPending}
                      className="w-full gap-2 bg-green-900/30 hover:bg-green-900/50 text-green-400"
                    >
                      <Shield className="w-4 h-4" /> Unrestrict & Clear Strikes
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-12 text-center">
              <Eye className="w-12 h-12 text-blue-400/20 mx-auto mb-4" />
              <p className="text-blue-400/50">Select a user to view details and manage their account</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}