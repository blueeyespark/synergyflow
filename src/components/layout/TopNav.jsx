import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
// TopNav — YouTube-style nav with avatar dropdown
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Moon, Sun, Settings, LogOut, Search,
  Tv, Users, Scan, LayoutDashboard,
  Radio, PlaySquare, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/notifications/NotificationBell";
import ChannelSwitcher from "@/components/layout/ChannelSwitcher";

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
}) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChannelId, setActiveChannelId] = useState(() => {
    try { return localStorage.getItem("activeChannelId") || null; } catch { return null; }
  });

  const handleChannelSwitch = (channelId) => {
    setActiveChannelId(channelId);
    localStorage.setItem("activeChannelId", channelId);
    // Dispatch event so other components can react
    window.dispatchEvent(new CustomEvent("activeChannelChanged", { detail: { channelId } }));
  };
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const isAdmin = user?.role === "admin";

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl ${darkMode ? "bg-[#03080f]/97 border-b border-[#0d1820]" : "bg-white border-b border-gray-200"}`}
      role="navigation"
    >
      <div className="flex items-center justify-between h-14 px-3 sm:px-5 gap-2">

        {/* Left: logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link to="/" className="flex items-center gap-1.5 group">
            <div className="relative w-8 h-8 flex items-center justify-center flex-shrink-0">
              <div className="absolute inset-0 rounded-lg bg-[#1e78ff]/20 border border-[#1e78ff]/40" />
              <span className="relative text-[#1e78ff] font-black text-base">V</span>
            </div>
            <span
              className="font-black text-base tracking-widest uppercase hidden sm:block"
              style={{ background: "linear-gradient(135deg,#1e78ff,#00c8ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
            >
              VStream
            </span>
          </Link>
        </div>

        {/* Center: search bar (desktop) */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-4 items-center">
          <div className={`flex w-full items-center rounded-xl overflow-hidden focus-within:border-[#1e78ff]/60 transition-all border ${darkMode ? "bg-[#030810] border-[#0d1820]" : "bg-gray-100 border-gray-300"}`}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search videos, creators..."
              className={`flex-1 px-4 py-2 text-sm outline-none bg-transparent ${darkMode ? "text-[#c8dff5] placeholder-blue-400/30" : "text-gray-900 placeholder-gray-400"}`}
            />
            <button type="submit" className={`px-4 py-2 border-l transition-colors ${darkMode ? "bg-[#050a14] hover:bg-[#1e78ff]/20 border-[#0d1820] text-blue-400" : "bg-gray-50 hover:bg-blue-50 border-gray-300 text-blue-600"}`}>
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Right: icons + avatar */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Mobile search */}
          <button
            className="md:hidden p-2 rounded-lg text-blue-400 hover:bg-blue-900/20 transition-colors"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search className="w-4 h-4" />
          </button>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setDarkMode(!darkMode)} 
            className="text-blue-400 hover:text-blue-200 hover:bg-blue-900/20"
            title={darkMode ? "Light Mode" : "Dark Mode"}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          {user && (
            <NotificationBell
              notifications={notifications}
              onMarkAsRead={onMarkAsRead}
              onMarkAllRead={onMarkAllRead}
              onDelete={onDeleteNotification}
              newVideos={newVideos}
            />
          )}

          {/* Avatar / account dropdown OR Sign In button */}
          {user ? (
          <div className="relative ml-1" ref={dropdownRef}>
            <button
              onClick={() => setAccountOpen(!accountOpen)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1e78ff] to-[#a855f7] flex items-center justify-center text-white text-sm font-black hover:ring-2 hover:ring-[#1e78ff]/60 transition-all"
            >
              {user?.full_name?.charAt(0) || "U"}
            </button>

            <AnimatePresence>
              {accountOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-[#030810] border border-[#0d1820] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50"
                >
                  {/* User header */}
                  <div className="px-4 py-4 border-b border-[#0d1820]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1e78ff] to-[#a855f7] flex items-center justify-center text-white font-black text-base flex-shrink-0">
                        {user?.full_name?.charAt(0) || "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#e8f4ff] truncate">{user?.full_name || "User"}</p>
                        <p className="text-xs text-blue-400/50 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Channel switcher */}
                  <div className="border-b border-[#0d1820] py-1">
                    <p className="text-xs font-bold text-blue-400/30 uppercase tracking-widest px-4 py-1.5">Switch Channel</p>
                    <ChannelSwitcher user={user} activeChannelId={activeChannelId} onSwitch={handleChannelSwitch} />
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <MenuItem icon={Tv} label="View Channel" to="/Channel" onClick={() => setAccountOpen(false)} />
                    <MenuItem icon={PlaySquare} label="Your Clips" to="/Shorts" onClick={() => setAccountOpen(false)} />
                  </div>

                  {/* Creator-only actions */}
                  {user?.email && (
                    <div className="border-t border-[#0d1820] py-1">
                      <p className="text-xs font-bold text-blue-400/30 uppercase tracking-widest px-4 py-1.5">Creator</p>
                      <MenuItem icon={Radio} label="Go Live Now" to="/StreamerDashboard" onClick={() => setAccountOpen(false)} />
                    </div>
                  )}

                  {/* Staff-only actions */}
                  {isAdmin && (
                    <div className="border-t border-[#0d1820] py-1">
                      <p className="text-xs font-bold text-blue-400/30 uppercase tracking-widest px-4 py-1.5">Staff</p>
                      <MenuItem icon={Scan} label="Staff Tools" to="/AITools" onClick={() => setAccountOpen(false)} />
                    </div>
                  )}

                  <div className="border-t border-[#0d1820] py-1">
                    <MenuItem icon={Settings} label="Settings" to="/Settings" onClick={() => setAccountOpen(false)} />
                    <button
                      onClick={() => {
                        setAccountOpen(false);
                        logout(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-blue-300/70 hover:bg-blue-900/20 hover:text-blue-200 transition-colors"
                    >
                      <LogOut className="w-4 h-4 flex-shrink-0" />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          ) : (
            <Button onClick={() => base44.auth.redirectToLogin(window.location.href)} className="gap-2">
              <Users className="w-4 h-4" /> Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Mobile search bar */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`md:hidden border-t overflow-hidden ${darkMode ? "border-[#0d1820]" : "border-gray-200"}`}
          >
            <form onSubmit={handleSearch} className="flex items-center px-3 py-2 gap-2">
              <div className={`flex flex-1 items-center rounded-xl overflow-hidden border ${darkMode ? "bg-[#030810] border-[#0d1820]" : "bg-gray-100 border-gray-300"}`}>
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="flex-1 px-3 py-2 text-sm text-[#c8dff5] placeholder-blue-400/30 outline-none bg-transparent"
                />
                <button type="submit" className="px-3 py-2 text-blue-400">
                  <Search className="w-4 h-4" />
                </button>
              </div>
              <button type="button" onClick={() => setSearchOpen(false)} className="text-blue-400/50 hover:text-blue-300 p-1">
                <X className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile slide-out menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="md:hidden border-t border-[#0d1820] bg-[#030810]"
          >
            <div className="px-4 py-3 space-y-0.5 max-h-[75vh] overflow-y-auto">
              {[
                { label: "Home", icon: LayoutDashboard, to: "/" },
                { label: "Live", icon: Radio, to: "/Live" },
                { label: "Clips", icon: PlaySquare, to: "/Shorts" },
                { label: "My Channel", icon: Tv, to: "/Channel" },
                { label: "Go Live", icon: Radio, to: "/StreamerDashboard" },
                { label: "AI Tools", icon: Scan, to: "/AITools" },
                ...(isAdmin ? [
                  { label: "Users", icon: Users, to: "/UserViewer" },
                ] : []),
                { label: "Settings", icon: Settings, to: "/Settings" },
              ].map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-blue-400/70 hover:bg-blue-900/20 hover:text-blue-200 transition-colors"
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </Link>
              ))}
              <div className="pt-2 mt-2 border-t border-[#0d1820]">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400/70 hover:bg-red-900/20 hover:text-red-300 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function MenuItem({ icon: Icon, label, to, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-blue-300/70 hover:bg-blue-900/20 hover:text-blue-200 transition-colors"
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{label}</span>
      <ChevronRight className="w-3.5 h-3.5 text-blue-400/20" />
    </Link>
  );
}