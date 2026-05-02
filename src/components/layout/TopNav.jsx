import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import {
  LayoutDashboard, LogOut, Menu, X, Users,
  Moon, Sun, Settings, ChevronDown, BarChart2, CheckSquare,
  Globe, Bot, Receipt, UserCog, History, Scan, Bug, Timer,
  Trophy, FolderOpen, LayoutTemplate, Share2, Zap, Clock, TrendingUp, Folder
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/notifications/NotificationBell";
import NavDropdown from "./NavDropdown";

const navGroups = [
  { label: "Dashboard", icon: LayoutDashboard, page: "Dashboard", single: true },
  {
    label: "Creator",
    icon: Zap,
    children: [
      { section: "Studio", items: [
        { name: "Creator Studio", icon: Zap, page: "CreatorStudio" },
      ]},
    ],
  },
  {
    label: "AI Tools",
    icon: Scan,
    adminOnly: true,
    children: [
      { section: null, items: [
        { name: "AI Tools", icon: Scan, page: "AITools" },
        { name: "Users", icon: Users, page: "UserViewer" },
      ]},
    ],
  },
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
  newVideos = [],
  currentWorkspace,
  onWorkspaceChange,
}) {
  const isAdmin = user?.role === "admin";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#03080f]/95 backdrop-blur-xl border-b border-blue-900/40 shadow-lg shadow-blue-900/20" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 px-1">
          {/* Logo & Workspace */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2 group" title="Go to Dashboard">
              <div className="relative w-9 h-9 flex items-center justify-center">
                <div className="absolute inset-0 rounded-lg bg-[#1e78ff]/20 group-hover:bg-[#1e78ff]/30 border border-[#1e78ff]/50 transition-all" />
                <span className="relative text-[#1e78ff] font-black text-lg tracking-tight">V</span>
              </div>
              <span className="font-black hidden sm:block text-lg tracking-widest uppercase" style={{background:'linear-gradient(135deg,#1e78ff,#00c8ff)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>VStream</span>
            </Link>

          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to={createPageUrl("CreatorStudio")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                currentPageName === "Dashboard" || currentPageName === "CreatorStudio" ? "bg-[#1e78ff]/20 text-[#1e78ff] border border-[#1e78ff]/50 shadow-lg shadow-blue-900/30" : "text-blue-400 hover:text-blue-200 hover:bg-blue-900/20"
              }`}
              aria-current={currentPageName === "CreatorStudio" ? "page" : "false"}
            >
              <LayoutDashboard className="w-4 h-4" />
              Studio
            </Link>

            {navGroups.filter(g => !g.single && (!g.adminOnly || isAdmin)).map(group => (
              <NavDropdown key={group.label} group={group} currentPageName={currentPageName} isAdmin={isAdmin} />
            ))}
            {navGroups.filter(g => g.single && g.page !== 'Dashboard' && (!g.adminOnly || isAdmin)).map(group => (
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
            <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)} className="text-blue-400 hover:text-blue-200 hover:bg-blue-900/20 border border-blue-900/40">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <NotificationBell
              notifications={notifications}
              onMarkAsRead={onMarkAsRead}
              onMarkAllRead={onMarkAllRead}
              onDelete={onDeleteNotification}
              newVideos={newVideos}
            />

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-blue-900/40">
              <div className="w-8 h-8 rounded-full bg-[#1e78ff]/20 border border-[#1e78ff]/50 flex items-center justify-center text-[#1e78ff] text-sm font-black flex-shrink-0">
                {user?.full_name?.charAt(0) || "U"}
              </div>
              <div className="hidden lg:block text-right">
                <p className="text-xs font-bold text-blue-200 leading-tight uppercase">{user?.full_name || "User"}</p>
                <p className="text-xs text-blue-500 leading-tight">{user?.role || "user"}</p>
              </div>
              <Link to={createPageUrl("Settings")}>
                <Button variant="ghost" size="icon" className="text-blue-400 hover:text-blue-200 hover:bg-blue-900/20 border border-blue-900/40">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => base44.auth.logout()} className="text-blue-400 hover:text-blue-200 hover:bg-blue-900/20 border border-blue-900/40">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>

            <Button variant="ghost" size="icon" className="md:hidden text-blue-400 hover:text-blue-200 hover:bg-blue-900/20 border border-blue-900/40" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
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
          className="md:hidden border-t border-blue-900/40 bg-[#03080f]/98"
        >
          <div className="px-4 py-3 space-y-1 max-h-[70vh] overflow-y-auto">
            {[
              { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
              ...navGroups
                .filter(g => g.single && g.page !== 'Dashboard' && (!g.adminOnly || isAdmin))
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
                  currentPageName === item.page ? "bg-[#1e78ff]/20 text-[#1e78ff] border border-[#1e78ff]/50" : "text-blue-400 hover:text-blue-200 hover:bg-blue-900/20"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
            <div className="pt-3 mt-3 border-t border-blue-900/40">
              <div className="px-3 py-2">
                <p className="text-sm font-bold text-blue-200 uppercase">{user?.full_name}</p>
                <p className="text-xs text-blue-500">{user?.email}</p>
              </div>
              <Button variant="ghost" onClick={() => base44.auth.logout()} className="w-full justify-start text-blue-400 hover:text-blue-200 hover:bg-blue-900/20 mt-1 font-bold border border-blue-900/40">
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
}