import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  LayoutDashboard, FolderKanban, LogOut, Menu, X, Users,
  Moon, Sun, Settings, ChevronDown, BarChart2, CheckSquare,
  Globe, Bot, Receipt, UserCog, History, Scan, Bug, Timer,
  Trophy, FolderOpen, LayoutTemplate, Share2, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/notifications/NotificationBell";
import WorkspaceSelector from "@/components/workspace/WorkspaceSelector";
import NavDropdown from "./NavDropdown";

const navGroups = [
  { label: "Dashboard", icon: LayoutDashboard, page: "Dashboard", single: true },
  { label: "Work", icon: FolderKanban, single: true, page: "WorkHub" },
  { label: "Finance", icon: Receipt, single: true, page: "Reports" },
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/85 dark:bg-gradient-to-r dark:from-slate-900 dark:to-slate-800 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700/50 shadow-sm" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 px-1">
          {/* Logo & Workspace */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2 group" title="Go to Dashboard">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100 hidden sm:block text-lg">Planify</span>
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
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentPageName === "Dashboard" ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
              }`}
              aria-current={currentPageName === "Dashboard" ? "page" : "false"}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              to={createPageUrl("WorkHub")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentPageName === "WorkHub" ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
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
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentPageName === 'UserViewer' ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
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
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentPageName === group.page ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
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
            <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)} className="text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <NotificationBell
              notifications={notifications}
              onMarkAsRead={onMarkAsRead}
              onMarkAllRead={onMarkAllRead}
              onDelete={onDeleteNotification}
            />

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {user?.full_name?.charAt(0) || "U"}
              </div>
              <div className="hidden lg:block text-right">
                <p className="text-xs font-medium text-slate-900 dark:text-slate-100 leading-tight">{user?.full_name || "User"}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight">{user?.role || "user"}</p>
              </div>
              <Link to={createPageUrl("Settings")}>
                <Button variant="ghost" size="icon" className="text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => base44.auth.logout()} className="text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>

            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
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
          className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  currentPageName === item.page ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600" : "text-slate-600 dark:text-slate-300"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user?.full_name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
              </div>
              <Button variant="ghost" onClick={() => base44.auth.logout()} className="w-full justify-start text-slate-600 dark:text-slate-300 mt-1">
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
}