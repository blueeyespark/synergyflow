import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PointsToast from "@/components/gamification/PointsToast";
import MobileNav from "@/components/MobileNav";
import OfflineBanner from "@/components/OfflineBanner";
import AIAssistant from "@/components/AIAssistant";
import AIProactivePopup from "@/components/AIProactivePopup";
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
    localStorage.setItem("darkMode", darkMode);
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
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${darkMode ? "dark bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-slate-50 via-white to-indigo-50/20"}`}>
      {pointsEvent && <PointsToast event={pointsEvent} onDismiss={() => setPointsEvent(null)} />}
      <OfflineBanner />
      <AIAssistant projects={projects} tasks={tasks} budget={budget} />
      <AIProactivePopup projects={projects} tasks={tasks} />

      <style>{`
        html {
          scroll-behavior: smooth;
        }
        
        * {
          scroll-padding-top: 4rem;
        }
        
        .dark .bg-white { background-color: rgb(30 41 59) !important; }
        .dark .bg-slate-50 { background-color: rgb(15 23 42) !important; }
        .dark .bg-slate-100 { background-color: rgb(51 65 85) !important; }
        .dark .text-slate-900 { color: rgb(248 250 252) !important; }
        .dark .text-slate-800 { color: rgb(226 232 240) !important; }
        .dark .text-slate-700 { color: rgb(203 213 225) !important; }
        .dark .text-slate-600 { color: rgb(148 163 184) !important; }
        .dark .text-slate-500 { color: rgb(148 163 184) !important; }
        .dark .text-slate-400 { color: rgb(100 116 139) !important; }
        .dark .border-slate-100, .dark .border-slate-200 { border-color: rgb(51 65 85) !important; }
        .dark .border-slate-300 { border-color: rgb(71 85 105) !important; }
        .dark .bg-white\\/80 { background-color: rgba(30, 41, 59, 0.95) !important; }
        .dark input, .dark textarea, .dark select { background-color: rgb(51 65 85) !important; color: rgb(248 250 252) !important; border-color: rgb(71 85 105) !important; }
        .dark input::placeholder, .dark textarea::placeholder { color: rgb(100 116 139) !important; }
        .dark .bg-indigo-50 { background-color: rgba(99, 102, 241, 0.15) !important; }
        .dark .bg-green-100 { background-color: rgba(34, 197, 94, 0.2) !important; }
        .dark .bg-red-100 { background-color: rgba(239, 68, 68, 0.2) !important; }
        .dark .bg-amber-100 { background-color: rgba(245, 158, 11, 0.2) !important; }
        .dark .bg-purple-100 { background-color: rgba(168, 85, 247, 0.2) !important; }
        .dark .bg-blue-100 { background-color: rgba(59, 130, 246, 0.2) !important; }
        .dark [data-radix-popper-content-wrapper] > div { background-color: rgb(30 41 59) !important; border-color: rgb(51 65 85) !important; }
        .dark [role="dialog"] { background-color: rgb(30 41 59) !important; border-color: rgb(51 65 85) !important; }
        .dark [role="listbox"] { background-color: rgb(30 41 59) !important; }
        .dark [role="option"]:hover { background-color: rgb(51 65 85) !important; }
        .dark .hover\\:bg-slate-50:hover { background-color: rgb(51 65 85) !important; }
        .dark .hover\\:bg-slate-100:hover { background-color: rgb(51 65 85) !important; }
        .dark table { color: rgb(248 250 252) !important; }
        .dark th, .dark td { border-color: rgb(51 65 85) !important; }
        .dark .divide-slate-100 > * + * { border-color: rgb(51 65 85) !important; }
        .dark .divide-slate-200 > * + * { border-color: rgb(51 65 85) !important; }
        .dark h1, .dark h2, .dark h3, .dark h4, .dark h5, .dark h6 { color: rgb(248 250 252) !important; }
        .dark p { color: rgb(203 213 225); }
        .dark .recharts-cartesian-grid line { stroke: rgb(51 65 85) !important; }
        .dark .recharts-text { fill: rgb(148 163 184) !important; }
        .dark .shadow-sm, .dark .shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3) !important; }
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