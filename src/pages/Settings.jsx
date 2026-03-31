import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { User, Bell, Palette, Shield, Save, Check, Calendar, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [settings, setSettings] = useState({
    full_name: "",
    email: "",
    notifications_enabled: true,
    email_reminders: true,
    weekly_digest: false,
    theme: "light",
    default_view: "list"
  });

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setSettings(prev => ({
        ...prev,
        full_name: u?.full_name || "",
        email: u?.email || "",
        notifications_enabled: u?.notifications_enabled ?? true,
        email_reminders: u?.email_reminders ?? true,
        weekly_digest: u?.weekly_digest ?? false,
        theme: u?.theme || "light",
        default_view: u?.default_view || "list",
        calendar_sync_enabled: u?.calendar_sync_enabled ?? false
      }));
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({
        notifications_enabled: settings.notifications_enabled,
        email_reminders: settings.email_reminders,
        weekly_digest: settings.weekly_digest,
        theme: settings.theme,
        default_view: settings.default_view,
        calendar_sync_enabled: settings.calendar_sync_enabled
      });
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await base44.functions.invoke('syncTasksToGoogleCalendar', {});
      toast.success("Tasks synced to Google Calendar");
    } catch (error) {
      toast.error("Sync failed. Ensure Google Calendar is connected.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-slate-500 mt-1">Manage your account preferences</p>
        </motion.div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
            <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 rounded-lg">
              <User className="w-4 h-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 rounded-lg">
              <Bell className="w-4 h-4" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 rounded-lg">
              <Palette className="w-4 h-4" /> Appearance
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 rounded-lg">
              <Calendar className="w-4 h-4" /> Calendar Sync
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6"
            >
              <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {settings.full_name?.charAt(0) || "U"}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900">{settings.full_name || "User"}</h3>
                  <p className="text-slate-500">{settings.email}</p>
                </div>
              </div>

              <div className="grid gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={settings.full_name}
                    disabled
                    className="bg-slate-50"
                  />
                  <p className="text-xs text-slate-400 mt-1">Contact support to change your name</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={settings.email}
                    disabled
                    className="bg-slate-50"
                  />
                </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
            >
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div>
                  <p className="font-medium text-slate-900">Push Notifications</p>
                  <p className="text-sm text-slate-500">Receive in-app notifications</p>
                </div>
                <Switch
                  checked={settings.notifications_enabled}
                  onCheckedChange={(v) => setSettings({ ...settings, notifications_enabled: v })}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div>
                  <p className="font-medium text-slate-900">Email Reminders</p>
                  <p className="text-sm text-slate-500">Get task reminders via email</p>
                </div>
                <Switch
                  checked={settings.email_reminders}
                  onCheckedChange={(v) => setSettings({ ...settings, email_reminders: v })}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div>
                  <p className="font-medium text-slate-900">Weekly Digest</p>
                  <p className="text-sm text-slate-500">Summary of your weekly activity</p>
                </div>
                <Switch
                  checked={settings.weekly_digest}
                  onCheckedChange={(v) => setSettings({ ...settings, weekly_digest: v })}
                />
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="appearance">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6"
            >
              <div>
                <Label className="mb-3 block">Theme</Label>
                <div className="grid grid-cols-2 gap-3">
                  {["light", "dark"].map(theme => (
                    <button
                      key={theme}
                      onClick={() => setSettings({ ...settings, theme })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        settings.theme === theme 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-full h-16 rounded-lg mb-2 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white border'}`} />
                      <p className="font-medium capitalize">{theme}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Default View</Label>
                <div className="grid grid-cols-2 gap-3">
                  {["list", "gantt"].map(view => (
                    <button
                      key={view}
                      onClick={() => setSettings({ ...settings, default_view: view })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        settings.default_view === view 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-medium capitalize">{view} View</p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="calendar">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
            >
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div>
                  <p className="font-medium text-slate-900">Google Calendar Sync</p>
                  <p className="text-sm text-slate-500">Automatically push tasks to Google Calendar</p>
                </div>
                <Switch
                  checked={settings.calendar_sync_enabled || false}
                  onCheckedChange={(v) => setSettings({ ...settings, calendar_sync_enabled: v })}
                />
              </div>
              {settings.calendar_sync_enabled && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <p className="text-sm text-indigo-700 mb-3">Sync tasks with due dates to your Google Calendar</p>
                  <button
                    onClick={handleSyncNow}
                    disabled={syncing}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                    {syncing ? "Syncing..." : "Sync Now"}
                  </button>
                </motion.div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 flex justify-end"
        >
          <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            {saving ? <span className="animate-spin">⏳</span> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </motion.div>
      </div>
    </div>
  );
}