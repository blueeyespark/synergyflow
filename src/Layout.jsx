import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  LayoutDashboard, FolderKanban, LogOut, Menu, X,
  Calendar, DollarSign, Users, Share2, FolderOpen, Moon, Sun, Settings, Trophy, Scan,
  LayoutTemplate, Bug, Timer, BarChart2, CheckSquare, Globe, Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/notifications/NotificationBell";
import MobileNav from "@/components/MobileNav";
import PointsToast from "@/components/gamification/PointsToast";
import WorkspaceSelector from "@/components/workspace/WorkspaceSelector";
import OfflineBanner from "@/components/OfflineBanner";
import AIAssistant from "@/components/AIAssistant";
import AIProactivePopup from "@/components/AIProactivePopup";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Projects", icon: FolderKanban, page: "Projects" },
  { name: "Planner", icon: FolderOpen, page: "Planner" },
  { name: "Calendar", icon: Calendar, page: "Calendar" },
  { name: "Budget", icon: DollarSign, page: "Budget" },
  { name: "Reports", icon: Share2, page: "Reports" },
  { name: "Blog", icon: Users, page: "Blog" },
  { name: "Templates", icon: LayoutTemplate, page: "Templates" },
  { name: "Leaderboard", icon: Trophy, page: "Leaderboard" },
  { name: "AI Scanner", icon: Scan, page: "AIScanner" },
  { name: "Bug Monitor", icon: Bug, page: "AIBugMonitor" },
  { name: "Time Tracking", icon: Timer, page: "TimeTracking" },
  { name: "Analytics", icon: BarChart2, page: "Analytics" },
  { name: "Tasks", icon: CheckSquare, page: "Tasks" },
  { name: "Workload", icon: Users, page: "WorkloadDashboard" },
  { name: "Client Portal", icon: Globe, page: "ClientPortal" },
  { name: "Discord", icon: Bot, page: "DiscordBot" },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pointsEvent, setPointsEvent] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });
  const [currentWorkspace, setCurrentWorkspace] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('currentWorkspace');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });


  const queryClient = useQueryClient();

  useEffect(() => {
    if (currentWorkspace) {
      localStorage.setItem('currentWorkspace', JSON.stringify(currentWorkspace));
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ['layout-projects'],
    queryFn: () => base44.entities.Project.list(),
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['layout-tasks'],
    queryFn: () => base44.entities.Task.list(),
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: budget = [] } = useQuery({
    queryKey: ['layout-budget'],
    queryFn: () => base44.entities.Budget.list(),
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000,
    refetchInterval: false,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user?.email }, '-created_date'),
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => 
        base44.entities.Notification.update(n.id, { is_read: true })
      ));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.email) return;
    
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.data?.user_email === user.email) {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    });
    
    return unsubscribe;
  }, [user?.email, queryClient]);

  return (
    <div className={`min-h-screen transition-colors ${darkMode ? 'dark bg-slate-900' : 'bg-slate-50'}`}>
      {pointsEvent && <PointsToast event={pointsEvent} onDismiss={() => setPointsEvent(null)} />}
      <OfflineBanner />
      <AIAssistant projects={projects} tasks={tasks} budget={budget} />
      <AIProactivePopup projects={projects} tasks={tasks} />
      <style>{`
        .dark { --background: 15 23 42; --foreground: 248 250 252; }
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
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Workspace */}
            <div className="flex items-center gap-2">
              <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <span className="font-semibold text-slate-900 hidden sm:block">Planify</span>
              </Link>
              <span className="text-slate-300 hidden sm:block">/</span>
              <div className="hidden sm:block">
                <WorkspaceSelector
                  currentWorkspace={currentWorkspace}
                  onWorkspaceChange={setCurrentWorkspace}
                  user={user}
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-indigo-50 text-indigo-600' 
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDarkMode(!darkMode)}
                className="text-slate-400 hover:text-slate-600"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <NotificationBell
                notifications={notifications}
                onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
                onMarkAllRead={() => markAllReadMutation.mutate()}
                onDelete={(id) => deleteNotificationMutation.mutate(id)}
              />
              
              <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">{user?.full_name || 'User'}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <Link to={createPageUrl("Settings")}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => base44.auth.logout()}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-t border-slate-200 bg-white"
          >
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive 
                        ? 'bg-indigo-50 text-indigo-600' 
                        : 'text-slate-600'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
              <div className="pt-3 mt-3 border-t border-slate-100">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">{user?.full_name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => base44.auth.logout()}
                  className="w-full justify-start text-slate-600 mt-1"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-16 pb-16 md:pb-0">
        {children}
      </main>
      <MobileNav currentPageName={currentPageName} />
    </div>
  );
}