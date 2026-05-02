import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  User, Bell, Palette, Shield, Save, Calendar, Loader2,
  Moon, Sun, Eye, Mail, Volume2, CheckCircle2, LogOut
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const TABS = [
  { id: "profile",       label: "Profile",       icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance",    label: "Appearance",    icon: Palette },
  { id: "calendar",      label: "Calendar Sync", icon: Calendar },
  { id: "security",      label: "Security",      icon: Shield },
];

function Section({ title, children }) {
  return (
    <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-6 space-y-4">
      {title && <h3 className="text-sm font-bold text-[#e8f4ff] mb-4">{title}</h3>}
      {children}
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-blue-900/20 last:border-0">
      <div>
        <p className="text-sm font-semibold text-[#c8dff5]">{label}</p>
        {desc && <p className="text-xs text-blue-400/40 mt-0.5">{desc}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export default function Settings() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [settings, setSettings] = useState({
    notifications_enabled: true,
    email_reminders: true,
    weekly_digest: false,
    calendar_sync_enabled: false,
  });

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setSettings(prev => ({
        ...prev,
        notifications_enabled: u?.notifications_enabled ?? true,
        email_reminders: u?.email_reminders ?? true,
        weekly_digest: u?.weekly_digest ?? false,
        calendar_sync_enabled: u?.calendar_sync_enabled ?? false,
      }));
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe(settings);
    toast.success("Settings saved");
    setSaving(false);
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await base44.functions.invoke("syncTasksToGoogleCalendar", {});
      toast.success("Synced to Google Calendar");
    } catch {
      toast.error("Sync failed. Ensure Google Calendar is connected.");
    }
    setSyncing(false);
  };

  const set = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  return (
    <div className="min-h-screen bg-[#03080f] text-[#e8f4ff]">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-black" style={{ background: "linear-gradient(135deg,#1e78ff,#00c8ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Settings
          </h1>
          <p className="text-sm text-blue-400/50 mt-0.5">Manage your account & preferences</p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar tabs */}
          <aside className="md:w-48 flex-shrink-0">
            <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-2 space-y-0.5">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      active
                        ? "bg-[#1e78ff]/15 text-[#1e78ff] border border-[#1e78ff]/25"
                        : "text-blue-400/60 hover:bg-blue-900/20 hover:text-blue-200"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* PROFILE */}
            {activeTab === "profile" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <Section>
                  {/* Avatar row */}
                  <div className="flex items-center gap-4 pb-5 border-b border-blue-900/30">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1e78ff] to-[#a855f7] flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-900/40 flex-shrink-0">
                      {user?.full_name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="text-lg font-black text-[#e8f4ff]">{user?.full_name || "User"}</p>
                      <p className="text-sm text-blue-400/50">{user?.email}</p>
                      {user?.role === "admin" && (
                        <span className="inline-flex items-center gap-1 text-xs bg-[#1e78ff]/15 text-[#1e78ff] border border-[#1e78ff]/25 rounded-full px-2 py-0.5 mt-1">
                          <CheckCircle2 className="w-3 h-3" /> Admin
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-blue-400/50 uppercase tracking-wider mb-1.5 block">Full Name</label>
                      <div className="bg-[#0a1525] border border-blue-900/40 rounded-xl px-3 py-2.5 text-sm text-[#9fc3e8]">
                        {user?.full_name || "—"}
                      </div>
                      <p className="text-xs text-blue-400/30 mt-1">Contact support to update your name</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-blue-400/50 uppercase tracking-wider mb-1.5 block">Email</label>
                      <div className="bg-[#0a1525] border border-blue-900/40 rounded-xl px-3 py-2.5 text-sm text-[#9fc3e8] flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-blue-400/40" />
                        {user?.email}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-blue-400/50 uppercase tracking-wider mb-1.5 block">Role</label>
                      <div className="bg-[#0a1525] border border-blue-900/40 rounded-xl px-3 py-2.5 text-sm text-[#9fc3e8] capitalize">
                        {user?.role || "user"}
                      </div>
                    </div>
                  </div>
                </Section>

                <div className="flex justify-end">
                  <button
                    onClick={() => base44.auth.logout()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-400 border border-red-900/40 hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              </motion.div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === "notifications" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Section title="Notification Preferences">
                  <ToggleRow
                    label="In-App Notifications"
                    desc="Receive alerts and updates inside the app"
                    checked={settings.notifications_enabled}
                    onChange={v => set("notifications_enabled", v)}
                  />
                  <ToggleRow
                    label="Email Reminders"
                    desc="Get task and deadline reminders via email"
                    checked={settings.email_reminders}
                    onChange={v => set("email_reminders", v)}
                  />
                  <ToggleRow
                    label="Weekly Digest"
                    desc="Receive a weekly summary of your activity"
                    checked={settings.weekly_digest}
                    onChange={v => set("weekly_digest", v)}
                  />
                </Section>
              </motion.div>
            )}

            {/* APPEARANCE */}
            {activeTab === "appearance" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <Section title="Theme">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "dark", label: "Cyber Dark", icon: Moon, preview: "bg-[#03080f] border-blue-900/60" },
                      { value: "light", label: "Light Mode", icon: Sun, preview: "bg-white border-slate-200" },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => set("theme", opt.value)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          settings.theme === opt.value
                            ? "border-[#1e78ff] bg-[#1e78ff]/10"
                            : "border-blue-900/40 hover:border-blue-700/60"
                        }`}
                      >
                        <div className={`w-full h-14 rounded-lg mb-3 border ${opt.preview}`} />
                        <div className="flex items-center gap-2">
                          <opt.icon className="w-3.5 h-3.5 text-blue-400/60" />
                          <p className="text-sm font-semibold text-[#c8dff5]">{opt.label}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </Section>

                <Section title="Default Task View">
                  <div className="grid grid-cols-2 gap-3">
                    {["list", "gantt"].map(v => (
                      <button
                        key={v}
                        onClick={() => set("default_view", v)}
                        className={`p-3 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${
                          settings.default_view === v
                            ? "border-[#1e78ff] bg-[#1e78ff]/10 text-[#1e78ff]"
                            : "border-blue-900/40 text-blue-400/60 hover:border-blue-700/60 hover:text-blue-300"
                        }`}
                      >
                        {v} View
                      </button>
                    ))}
                  </div>
                </Section>
              </motion.div>
            )}

            {/* CALENDAR */}
            {activeTab === "calendar" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Section title="Google Calendar Sync">
                  <ToggleRow
                    label="Enable Calendar Sync"
                    desc="Automatically push tasks with due dates to Google Calendar"
                    checked={settings.calendar_sync_enabled}
                    onChange={v => set("calendar_sync_enabled", v)}
                  />
                  {settings.calendar_sync_enabled && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-[#1e78ff]/10 border border-[#1e78ff]/25 rounded-xl mt-2">
                      <p className="text-sm text-[#9fc3e8] mb-3">Sync all tasks that have due dates to your connected Google Calendar.</p>
                      <button
                        onClick={handleSyncNow}
                        disabled={syncing}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1e78ff] hover:bg-[#3d8fff] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
                      >
                        {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                        {syncing ? "Syncing..." : "Sync Now"}
                      </button>
                    </motion.div>
                  )}
                </Section>
              </motion.div>
            )}

            {/* SECURITY */}
            {activeTab === "security" && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Section title="Account Security">
                  <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/25 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#c8dff5]">Account is secured</p>
                      <p className="text-xs text-blue-400/50 mt-0.5">Authentication is managed securely by the platform. No password changes required.</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between py-3 border-b border-blue-900/20">
                      <p className="text-sm text-[#9fc3e8]">Signed in as</p>
                      <p className="text-sm font-semibold text-[#e8f4ff]">{user?.email}</p>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <p className="text-sm text-[#9fc3e8]">Account role</p>
                      <span className="text-xs font-bold capitalize bg-[#1e78ff]/15 text-[#1e78ff] border border-[#1e78ff]/25 rounded-full px-2.5 py-1">
                        {user?.role || "user"}
                      </span>
                    </div>
                  </div>
                </Section>

                <div className="mt-4">
                  <button
                    onClick={() => base44.auth.logout()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-900/40 text-red-400 hover:bg-red-900/20 text-sm font-semibold transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign out of all sessions
                  </button>
                </div>
              </motion.div>
            )}

            {/* Save button (not shown on profile/security) */}
            {!["profile", "security"].includes(activeTab) && (
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#1e78ff] hover:bg-[#3d8fff] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}