import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  LayoutDashboard, FolderKanban, LogOut, Menu, X, Users,
  Moon, Sun, Settings, ChevronDown, BarChart2, CheckSquare,
  Globe, Bot, Receipt, UserCog, History, Scan, Bug, Timer,
  Trophy, FolderOpen, LayoutTemplate, Share2, Zap, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/notifications/NotificationBell";
import WorkspaceSelector from "@/components/workspace/WorkspaceSelector";
import NavDropdown from "./NavDropdown";

const navGroups = [
  { label: "Dashboard", icon: LayoutDashboard, page: "Dashboard", single: true },
  { label: "Work", icon: FolderKanban, single: true, page: "WorkHub" },
  { label: "Finance", icon: Receipt, single: true, page: "Reports" },
  { label: "Time Tracking", icon: Timer, single: true, page: "TimeTrackingAnalytics", adminOnly: false },
  {
    label: "Team",
    icon: Users,
    children: [
      { name: "Leaderboard", icon: Trophy, page: "Leaderboard" },
      { name: "Reports & Analytics", icon: BarChart2, page: "Reports" },
    ],
  },
  {
    label: "Content",
    icon: Globe,
    children: [
      { name: "Blog", icon: Globe, page: "Blog" },
      { name: "Client Portal", icon: Globe, page: "ClientPortal", adminOnly: true },
      { name: "Discord Bot", icon: Bot, page: "DiscordBot", adminOnly: true },
    ],
  },
  { label: "AI Tools", icon: Scan, single: true, page: "AITools", adminOnly: true },
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900/95 via-purple-900/80 to-slate-900/95 backdrop-blur-xl border-b-2 border-purple-500/50 shadow-2xl shadow-purple-500/20" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 px-1">
          {/* Logo & Workspace */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2 group" title="Go to Dashboard">
              <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center transform group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-purple-500/50 transition-all duration-200">
                <span className="text-slate-900 font-black text-lg">P</span>
              </div>
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 hidden sm:block text-lg uppercase tracking-wider">Planify</span>
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
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all duration-200 ${
                currentPageName === "Dashboard" ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/50" : "text-purple-300 hover:text-purple-100 hover:bg-purple-500/20"
              }`}
              aria-current={currentPageName === "Dashboard" ? "page" : "false"}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              to={createPageUrl("WorkHub")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all duration-200 ${
                currentPageName === "WorkHub" ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50" : "text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20"
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
            {navGroups.filter(g => g.single && g.page !== 'Dashboard' && g.page !== 'WorkHub' && g.page !== 'Reports' && (!g.adminOnly || isAdmin)).map(group => (
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
            <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)} className="text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 border border-purple-500/30">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <NotificationBell
              notifications={notifications}
              onMarkAsRead={onMarkAsRead}
              onMarkAllRead={onMarkAllRead}
              onDelete={onDeleteNotification}
            />

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l-2 border-purple-500/50">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-slate-900 text-sm font-black flex-shrink-0 shadow-lg shadow-purple-500/50">
                {user?.full_name?.charAt(0) || "U"}
              </div>
              <div className="hidden lg:block text-right">
                <p className="text-xs font-bold text-purple-300 leading-tight uppercase">{user?.full_name || "User"}</p>
                <p className="text-xs text-cyan-400 leading-tight">{user?.role || "user"}</p>
              </div>
              <Link to={createPageUrl("Settings")}>
                <Button variant="ghost" size="icon" className="text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 border border-purple-500/30">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => base44.auth.logout()} className="text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 border border-cyan-500/30">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>

            <Button variant="ghost" size="icon" className="md:hidden text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 border border-purple-500/30" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
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
          className="md:hidden border-t-2 border-purple-500/50 bg-gradient-to-b from-slate-900 to-slate-950"
        >
          <div className="px-4 py-3 space-y-1 max-h-[70vh] overflow-y-auto">
            {[
              { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
              { name: "Work", icon: FolderKanban, page: "WorkHub" },
              ...navGroups
                .filter(g => !g.single && (!g.adminOnly || isAdmin))
                .flatMap(g => (g.children || []).filter(c => !c.adminOnly || isAdmin))
            ].map(item => (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide transition-all ${
                  currentPageName === item.page ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/50" : "text-purple-300 hover:text-purple-100 hover:bg-purple-500/20"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
            <div className="pt-3 mt-3 border-t-2 border-purple-500/30">
              <div className="px-3 py-2">
                <p className="text-sm font-bold text-purple-300 uppercase">{user?.full_name}</p>
                <p className="text-xs text-cyan-400">{user?.email}</p>
              </div>
              <Button variant="ghost" onClick={() => base44.auth.logout()} className="w-full justify-start text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 mt-1 font-bold border border-cyan-500/30">
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
}