import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Upload, X, ImageIcon, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChannelEditor() {
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [form, setForm] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: channels = [] } = useQuery({
    queryKey: ["channels-all"],
    queryFn: () => base44.entities.Channel.list(),
    staleTime: 5 * 60 * 1000,
  });

  const channel = channels.find(c => c.creator_email === user?.email);

  useEffect(() => {
    if (channel && !form) {
      setForm({
        channel_name: channel.channel_name || "",
        description: channel.description || "",
        avatar_url: channel.avatar_url || "",
        banner_url: channel.banner_url || "",
      });
    }
  }, [channel]);

  const handleImageUpload = async (file, type) => {
    if (type === "avatar") setUploadingAvatar(true);
    else setUploadingBanner(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, [type === "avatar" ? "avatar_url" : "banner_url"]: file_url }));
    if (type === "avatar") setUploadingAvatar(false);
    else setUploadingBanner(false);
  };

  const handleSave = async () => {
    if (!channel || !form) return;
    setSaving(true);
    await base44.entities.Channel.update(channel.id, {
      channel_name: form.channel_name,
      description: form.description,
      avatar_url: form.avatar_url,
      banner_url: form.banner_url,
    });
    queryClient.invalidateQueries({ queryKey: ["channels-all"] });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!user || !channel || !form) {
    return <div className="text-blue-400/40 text-sm py-8 text-center">Loading channel...</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-black text-[#e8f4ff] mb-1">Edit Channel</h2>
        <p className="text-xs text-blue-400/40">Changes are reflected on your public channel page</p>
      </div>

      {/* Banner */}
      <div>
        <label className="text-xs font-semibold text-blue-400/60 uppercase tracking-wider mb-2 block">Banner Image</label>
        <div className="relative h-36 rounded-2xl overflow-hidden bg-gradient-to-r from-[#1e78ff]/30 to-[#a855f7]/30 border border-blue-900/40">
          {form.banner_url && <img src={form.banner_url} className="w-full h-full object-cover" alt="Banner" />}
          <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-black/30 transition-colors group gap-2">
            <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handleImageUpload(e.target.files[0], "banner")} />
            {uploadingBanner
              ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <ImageIcon className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />}
            <span className="text-xs text-white/50 group-hover:text-white transition-colors">{form.banner_url ? "Change Banner" : "Upload Banner"}</span>
          </label>
          {form.banner_url && (
            <button onClick={() => setForm(f => ({ ...f, banner_url: "" }))} className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 flex items-center justify-center text-white/70 hover:text-white transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Avatar */}
      <div>
        <label className="text-xs font-semibold text-blue-400/60 uppercase tracking-wider mb-2 block">Profile Picture</label>
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1e78ff] to-[#a855f7] flex items-center justify-center text-white text-2xl font-black overflow-hidden border-2 border-blue-900/40">
              {form.avatar_url
                ? <img src={form.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                : form.channel_name?.charAt(0) || "?"
              }
            </div>
            <label className="absolute inset-0 rounded-full cursor-pointer hover:bg-black/40 transition-colors flex items-center justify-center group">
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handleImageUpload(e.target.files[0], "avatar")} />
              {uploadingAvatar
                ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Upload className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />}
            </label>
          </div>
          <div>
            <p className="text-xs text-blue-400/50 mb-1">JPG, PNG, GIF — max 5MB</p>
            {form.avatar_url && <button onClick={() => setForm(f => ({ ...f, avatar_url: "" }))} className="text-xs text-red-400/60 hover:text-red-400 transition-colors flex items-center gap-1"><X className="w-3 h-3" /> Remove</button>}
          </div>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="text-xs font-semibold text-blue-400/60 uppercase tracking-wider mb-1.5 block">Channel Name</label>
        <input
          value={form.channel_name}
          onChange={e => setForm(f => ({ ...f, channel_name: e.target.value }))}
          className="w-full bg-[#0a1525] border border-blue-900/40 focus:border-[#1e78ff]/60 rounded-xl px-4 py-2.5 text-sm text-[#c8dff5] placeholder-blue-400/30 outline-none transition-colors"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-semibold text-blue-400/60 uppercase tracking-wider mb-1.5 block">Description</label>
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Tell viewers what your channel is about..."
          rows={4}
          className="w-full bg-[#0a1525] border border-blue-900/40 focus:border-[#1e78ff]/60 rounded-xl px-4 py-2.5 text-sm text-[#c8dff5] placeholder-blue-400/30 outline-none transition-colors resize-none"
        />
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saved
          ? <><CheckCircle className="w-4 h-4" /> Saved!</>
          : saving
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            : <><Save className="w-4 h-4" /> Save Changes</>}
      </Button>
    </div>
  );
}