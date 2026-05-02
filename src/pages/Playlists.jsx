import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ListVideo, Plus, Trash2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

export default function Playlists() {
  const [user, setUser] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const queryClient = useQueryClient();

  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ["playlists", user?.email],
    queryFn: () => user?.email ? base44.entities.Playlist.filter({ owner_email: user.email }) : [],
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (name) => base44.entities.Playlist.create({
      name,
      owner_email: user.email,
      video_ids: [],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      setNewPlaylistName("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (playlistId) => base44.entities.Playlist.delete(playlistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      setSelectedPlaylist(null);
    },
  });

  const removeFromPlaylist = useMutation({
    mutationFn: ({ playlistId, videoId }) => {
      const playlist = playlists.find(p => p.id === playlistId);
      const updated = (playlist?.video_ids || []).filter(id => id !== videoId);
      return base44.entities.Playlist.update(playlistId, { video_ids: updated });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
  });

  if (!user) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;

  if (selectedPlaylist) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button onClick={() => setSelectedPlaylist(null)} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 font-semibold">
            <ArrowLeft className="w-4 h-4" /> Back to Playlists
          </button>

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-black text-[#e8f4ff]">{selectedPlaylist.name}</h1>
            <button onClick={() => deleteMutation.mutate(selectedPlaylist.id)} className="text-red-400/60 hover:text-red-400 font-semibold transition-colors">
              Delete Playlist
            </button>
          </div>

          {selectedPlaylist.video_ids?.length > 0 ? (
            <div className="space-y-3">
              {selectedPlaylist.video_ids.map(videoId => (
                <div key={videoId} className="flex items-center justify-between p-3 bg-card rounded-lg border border-[#0d2040] group">
                  <p className="text-sm text-[#c8dff5]">Video ID: {videoId}</p>
                  <button onClick={() => removeFromPlaylist.mutate({ playlistId: selectedPlaylist.id, videoId })} className="text-red-400/60 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-blue-400/40">This playlist is empty</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link to="/" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-blue-400/20 flex items-center justify-center">
            <ListVideo className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#e8f4ff]">My Playlists</h1>
            <p className="text-sm text-blue-400/50 mt-1">{playlists.length} playlists</p>
          </div>
        </div>

        {/* Create Playlist */}
        <div className="mb-8 p-4 bg-card rounded-lg border border-[#0d2040]">
          <div className="flex gap-2">
            <input
              value={newPlaylistName}
              onChange={e => setNewPlaylistName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && newPlaylistName.trim() && createMutation.mutate(newPlaylistName)}
              placeholder="New playlist name..."
              className="flex-1 bg-[#0a1525] border border-[#1a3a60] rounded-lg px-3 py-2 text-sm text-[#c8dff5] placeholder-blue-400/30 outline-none focus:border-[#1e78ff]"
            />
            <button
              onClick={() => newPlaylistName.trim() && createMutation.mutate(newPlaylistName)}
              disabled={!newPlaylistName.trim() || createMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-[#1e78ff] hover:bg-[#3d8fff] disabled:opacity-40 rounded-lg text-white text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Create
            </button>
          </div>
        </div>

        {/* Playlists Grid */}
        {playlists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {playlists.map((playlist, i) => (
                <motion.button
                  key={playlist.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedPlaylist(playlist)}
                  className="p-4 bg-card rounded-lg border border-[#0d2040] hover:border-[#1e78ff] transition-colors text-left group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-[#e8f4ff] group-hover:text-[#1e78ff] transition-colors">{playlist.name}</h3>
                    <ListVideo className="w-4 h-4 text-blue-400/40" />
                  </div>
                  <p className="text-xs text-blue-400/50">{playlist.video_ids?.length || 0} videos</p>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-12">
            <ListVideo className="w-12 h-12 mx-auto text-blue-400/20 mb-3" />
            <p className="text-blue-400/40">No playlists yet</p>
          </div>
        )}
      </div>
    </div>
  );
}