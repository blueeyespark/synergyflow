import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PointsToast from "@/components/gamification/PointsToast";
import MobileNav from "@/components/MobileNav";
import OfflineBanner from "@/components/OfflineBanner";
import AIAssistant from "@/components/AIAssistant";
import TopNav from "@/components/layout/TopNav";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pointsEvent, setPointsEvent] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("darkMode") === "true";
    return false;
  });
  const [currentWorkspace, setCurrentWorkspace] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("currentWorkspace");
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (currentWorkspace) localStorage.setItem("currentWorkspace", JSON.stringify(currentWorkspace));
  }, [currentWorkspace]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list("-created_date"),
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000,
    refetchInterval: false,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.list("-created_date"),
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000,
    refetchInterval: false,
  });

  const { data: budget = [] } = useQuery({
    queryKey: ["budget"],
    queryFn: () => base44.entities.Budget.list("-date"),
    enabled: !!user?.email,
    staleTime: 15 * 60 * 1000,
    refetchInterval: false,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user?.email }, "-created_date"),
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["my-subscriptions", user?.email],
    queryFn: () => base44.entities.Subscription.filter({ subscriber_email: user?.email, status: "active" }),
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
  });

  const { data: allVideos = [] } = useQuery({
    queryKey: ["videos-all"],
    queryFn: () => base44.entities.Video.list("-created_date", 60),
    staleTime: 5 * 60 * 1000,
  });

  const { data: allChannels = [] } = useQuery({
    queryKey: ["channels-all"],
    queryFn: () => base44.entities.Channel.list(),
    staleTime: 5 * 60 * 1000,
  });

  // New videos from subscribed channels in the last 7 days
  const newVideosFromFollowed = (() => {
    const subscribedChannelIds = new Set(subscriptions.map(s => s.channel_id));
    const channelMap = allChannels.reduce((acc, c) => { acc[c.id] = c; return acc; }, {});
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return allVideos
      .filter(v =>
        subscribedChannelIds.has(v.channel_id) &&
        v.status === "ready" &&
        new Date(v.created_date).getTime() > sevenDaysAgo
      )
      .map(v => ({ video: v, channel: channelMap[v.channel_id] }));
  })();

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  useEffect(() => {
    if (!user?.email) return;
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.data?.user_email === user.email) {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }
    });
    return unsubscribe;
  }, [user?.email, queryClient]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative">
      {pointsEvent && <PointsToast event={pointsEvent} onDismiss={() => setPointsEvent(null)} />}
      <OfflineBanner />
      <AIAssistant projects={projects} tasks={tasks} budget={budget} userRole={user?.role || 'viewer'} />

      <style>{`
        html { scroll-behavior: smooth; }
        * { scroll-padding-top: 4rem; }

        /* Light mode (default) */
        html { background: #ffffff; }
        
        /* Dark mode overrides */
        html.dark { background: #03080f; }

        .dark .bg-white { background-color: #060d18 !important; }
        .dark .bg-slate-50, .dark .bg-gray-50 { background-color: #07111f !important; }
        .dark .bg-slate-100, .dark .bg-gray-100 { background-color: #0d1a2e !important; }
        .dark .bg-slate-200, .dark .bg-gray-200 { background-color: #122040 !important; }
        .dark .bg-slate-800, .dark .bg-gray-800 { background-color: #040a14 !important; }
        .dark .bg-slate-900, .dark .bg-gray-900 { background-color: #03080f !important; }
        .dark .bg-zinc-900 { background-color: #03080f !important; }
        .dark .bg-zinc-950 { background-color: #020608 !important; }
        .dark .bg-zinc-800 { background-color: #060d18 !important; }

        .dark .text-slate-900, .dark .text-gray-900 { color: #e8f4ff !important; }
        .dark .text-slate-800, .dark .text-gray-800 { color: #c8dff5 !important; }
        .dark .text-slate-700, .dark .text-gray-700 { color: #9fc3e8 !important; }
        .dark .text-slate-600, .dark .text-gray-600 { color: #6a9ec5 !important; }
        .dark .text-slate-500, .dark .text-gray-500 { color: #4a7ea0 !important; }
        .dark .text-slate-400, .dark .text-gray-400 { color: #3a6080 !important; }
        .dark .text-white { color: #e8f4ff !important; }
        .dark .text-zinc-300 { color: #9fc3e8 !important; }
        .dark .text-zinc-400 { color: #4a7ea0 !important; }
        .dark .text-zinc-500 { color: #3a6080 !important; }

        .dark .border-slate-100, .dark .border-slate-200, .dark .border-gray-100, .dark .border-gray-200 { border-color: #0d2040 !important; }
        .dark .border-slate-300, .dark .border-gray-300 { border-color: #1a3a60 !important; }
        .dark .border-zinc-800, .dark .border-zinc-700 { border-color: #0d2040 !important; }

        .dark input, .dark textarea, .dark select { background-color: #0a1525 !important; color: #c8dff5 !important; border-color: #1a3a60 !important; }
        .dark input::placeholder, .dark textarea::placeholder { color: #3a6080 !important; }

        .dark [data-radix-popper-content-wrapper] > div { background-color: #060d18 !important; border-color: #0d2040 !important; }
        .dark [role="dialog"] { background-color: #060d18 !important; border-color: #0d2040 !important; }
        .dark [role="listbox"] { background-color: #060d18 !important; }
        .dark [role="option"]:hover { background-color: #0d2040 !important; }

        .dark table { color: #c8dff5 !important; }
        .dark th, .dark td { border-color: #0d2040 !important; }

        .dark .recharts-cartesian-grid line { stroke: #0d2040 !important; }
        .dark .recharts-text { fill: #4a7ea0 !important; }

        .dark h1, .dark h2, .dark h3, .dark h4, .dark h5, .dark h6 { color: #e8f4ff; }
        .dark p { color: #9fc3e8; }
      `}</style>

      <TopNav
        user={user}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentPageName={currentPageName}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        notifications={notifications}
        onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
        onMarkAllRead={() => markAllReadMutation.mutate()}
        onDeleteNotification={(id) => deleteNotificationMutation.mutate(id)}
        newVideos={newVideosFromFollowed}
        currentWorkspace={currentWorkspace}
        onWorkspaceChange={setCurrentWorkspace}
      />

      <main className="flex-1 pt-16 pb-16 md:pb-0">
        {children}
      </main>
      <MobileNav currentPageName={currentPageName} />
    </div>
  );
}