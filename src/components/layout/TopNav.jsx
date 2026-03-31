import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  LayoutDashboard, FolderKanban, LogOut, Menu, X, Users,
  Moon, Sun, Settings, ChevronDown, BarChart2, CheckSquare,
  Globe, Bot, Receipt, UserCog, History, Scan, Bug, Timer,
  Trophy, FolderOpen, LayoutTemplate, Share2, Zap, Clock, TrendingUp, Folder
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/notifications/NotificationBell";
import WorkspaceSelector from "@/components/workspace/WorkspaceSelector";
import NavDropdown from "./NavDropdown";

const navGroups = [
  { label: "Dashboard", icon: LayoutDashboard, page: "Dashboard", single: true },
  { label: "Work", icon: FolderKanban, single: true, page: "WorkHub" },
  {
    label: "Create & Produce",
    icon: Zap,
    children: [
      { section: "Video Production", items: [
        { name: "Video Editor", icon: Clock, page: "VideoEditor" },
        { name: "Intro/Outro Maker", icon: Clock, page: "IntroOutroMaker" },
        { name: "Thumbnail Creator", icon: Clock, page: "ThumbnailMaker" },
      ]},
      { section: "Content Management", items: [
        { name: "Media Library", icon: Folder, page: "MediaLibrary" },
        { name: "Templates", icon: LayoutTemplate, page: "Templates" },
        { name: "Blog", icon: Globe, page: "Blog" },
      ]},
    ],
  },
  {
    label: "Insights & Analytics",
    icon: BarChart2,
    children: [
      { section: "Video Performance", items: [
        { name: "Video Analytics", icon: TrendingUp, page: "VideoAnalytics" },
      ]},
      { section: "Business Metrics", items: [
        { name: "Time Tracking", icon: Timer, page: "TimeTrackingAnalytics" },
        { name: "Reports", icon: Receipt, page: "Reports" },
      ]},
    ],
  },
  {
    label: "Team & Collaboration",
    icon: Users,
    children: [
      { section: "Team", items: [
        { name: "Leaderboard", icon: Trophy, page: "Leaderboard" },
      ]},
      { section: "Sharing & Engagement", items: [
        { name: "Client Portal", icon: Globe, page: "ClientPortal", adminOnly: true },
        { name: "Discord Bot", icon: Bot, page: "DiscordBot", adminOnly: true },
      ]},
    ],
  },
  { label: "AI Tools", icon: Scan, single: true, page: "AITools", adminOnly: true },
  { label: "Creator Studio", icon: Zap, single: true, page: "CreatorStudio" },
];

export default function TopNav({
  user,
  darkMode,
  setDarkMode,
  currentPageName,
  mobileMenuOpen,
  setMobileMenuOpen,
  notifications,
  onMarkAsRead,
  onMarkAllRead,
  onDeleteNotification,
  currentWorkspace,
  onWorkspaceChange,
}) {
  const isAdmin = user?.role === "admin";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-white via-blue-50 to-white backdrop-blur-lg border-b-2 border-cyan-200 shadow-lg shadow-cyan-300/20" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 px-1">
          {/* Logo & Workspace */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2 group" title="Go to Dashboard">
              <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center transform group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-purple-500/50 transition-all duration-200">
                <span className="text-slate-900 font-black text-lg">P</span>
              </div>
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 hidden sm:block text-lg uppercase tracking-wider">Planify</span>
            </Link>
            <span className="text-slate-300 hidden sm:block">/</span>
            <div className="hidden sm:block">
              <WorkspaceSelector currentWorkspace={currentWorkspace} onWorkspaceChange={onWorkspaceChange} user={user} />
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to={createPageUrl("Dashboard")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                currentPageName === "Dashboard" ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-400/30" : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
              }`}
              aria-current={currentPageName === "Dashboard" ? "page" : "false"}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              to={createPageUrl("WorkHub")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                currentPageName === "WorkHub" ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-400/30" : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
              }`}
              aria-current={currentPageName === "WorkHub" ? "page" : "false"}
            >
              <FolderKanban className="w-4 h-4" />
              Work
            </Link>

            {navGroups.filter(g => !g.single && (!g.adminOnly || isAdmin)).map(group => (
              <NavDropdown key={group.label} group={group} currentPageName={currentPageName} isAdmin={isAdmin} />
            ))}
            {isAdmin && (
              <Link
                to={createPageUrl('UserViewer')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all duration-200 ${
                  currentPageName === 'UserViewer' ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/50" : "text-yellow-300 hover:text-yellow-100 hover:bg-yellow-500/20"
                }`}
                aria-current={currentPageName === 'UserViewer' ? "page" : "false"}
              >
                <Users className="w-4 h-4" />
                Users
              </Link>
            )}
            {navGroups.filter(g => g.single && g.page !== 'Dashboard' && g.page !== 'WorkHub' && (!g.adminOnly || isAdmin)).map(group => (
              <Link
                key={group.page}
                to={createPageUrl(group.page)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all duration-200 ${
                  currentPageName === group.page ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/50" : "text-green-300 hover:text-green-100 hover:bg-green-500/20"
                }`}
                aria-current={currentPageName === group.page ? "page" : "false"}
              >
                <group.icon className="w-4 h-4" />
                {group.label}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)} className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <NotificationBell
              notifications={notifications}
              onMarkAsRead={onMarkAsRead}
              onMarkAllRead={onMarkAllRead}
              onDelete={onDeleteNotification}
            />

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l-2 border-cyan-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-lg shadow-cyan-400/30">
                {user?.full_name?.charAt(0) || "U"}
              </div>
              <div className="hidden lg:block text-right">
                <p className="text-xs font-bold text-slate-700 leading-tight uppercase">{user?.full_name || "User"}</p>
                <p className="text-xs text-slate-500 leading-tight">{user?.role || "user"}</p>
              </div>
              <Link to={createPageUrl("Settings")}>
                <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => base44.auth.logout()} className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>

            <Button variant="ghost" size="icon" className="md:hidden text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
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
          className="md:hidden border-t-2 border-cyan-200 bg-gradient-to-b from-slate-50 to-blue-50"
        >
          <div className="px-4 py-3 space-y-1 max-h-[70vh] overflow-y-auto">
            {[
              { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
              { name: "Work", icon: FolderKanban, page: "WorkHub" },
              ...navGroups
                .filter(g => g.single && g.page !== 'Dashboard' && g.page !== 'WorkHub' && (!g.adminOnly || isAdmin))
                .map(g => ({ name: g.label, icon: g.icon, page: g.page })),
              ...navGroups
                .filter(g => !g.single && (!g.adminOnly || isAdmin))
                .flatMap(g => (g.children || []).flatMap(section => section.items || []))
            ].map(item => (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  currentPageName === item.page ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-400/30" : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
            <div className="pt-3 mt-3 border-t-2 border-cyan-200">
              <div className="px-3 py-2">
                <p className="text-sm font-bold text-slate-700 uppercase">{user?.full_name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <Button variant="ghost" onClick={() => base44.auth.logout()} className="w-full justify-start text-slate-600 hover:text-slate-800 hover:bg-slate-100 mt-1 font-bold border border-slate-200">
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
}