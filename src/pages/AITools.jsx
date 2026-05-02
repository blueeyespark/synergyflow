import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scan, Users } from "lucide-react";
import { motion } from "framer-motion";
import AIScanner from "./AIScanner";
import AITokenGate from "@/components/aitools/AITokenGate";
import StaffManager from "@/components/aitools/StaffManager";
import UserManagement from "@/components/aitools/UserManagement";

export default function AITools() {
  const [user, setUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [tab, setTab] = useState("scanner");
  const [confirmedStaff, setConfirmedStaff] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("darkMode") === "true";
    return false;
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Check if user is admin or confirmed staff
  useEffect(() => {
    if (!user?.email) return;
    base44.entities.StaffAccess.filter({ email: user.email, is_active: true })
      .then(results => setConfirmedStaff(results.length > 0))
      .catch(() => setConfirmedStaff(false));
  }, [user?.email]);

  const isAdmin = user?.role === "admin";
  const isStaff = isAdmin || confirmedStaff || !!sessionToken;

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-[#03080f]" : "bg-white"}`}>
        <div className={`w-6 h-6 border-2 border-[#1e78ff] border-t-transparent rounded-full animate-spin`} />
      </div>
    );
  }

  if (!isStaff) {
    return <AITokenGate user={user} onGranted={setSessionToken} />;
  }

  return (
    <div className={`min-h-screen ${darkMode ? "bg-[#03080f] text-[#e8f4ff]" : "bg-white text-gray-900"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1e78ff] to-[#a855f7] flex items-center justify-center">
              <Scan className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-black">Staff Tools</h1>
          </div>
          <p className={darkMode ? "text-blue-400/50" : "text-gray-600"}>AI Scanner, Bug Monitor, Changes Log, and User Management</p>
        </motion.div>

        {/* Admin-only: Staff Manager section */}
        {isAdmin && (
          <div className={`mb-8 rounded-2xl p-6 border ${darkMode ? "bg-blue-900/10 border-blue-900/30" : "bg-blue-50 border-blue-200"}`}>
            <StaffManager currentUser={user} />
          </div>
        )}

        {/* Consolidated Tools */}
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className={`grid grid-cols-2 gap-2 p-1 rounded-xl w-full h-auto border ${darkMode ? "bg-[#060d18] border-blue-900/30" : "bg-gray-100 border-gray-300"}`}>
            <TabsTrigger value="scanner" className={`gap-2 py-2.5 border rounded-lg transition-all ${darkMode ? "data-[state=active]:bg-[#1e78ff]/20 data-[state=active]:text-[#1e78ff] data-[state=active]:border-[#1e78ff]/40" : "data-[state=active]:bg-blue-100 data-[state=active]:text-blue-600 data-[state=active]:border-blue-300"} border-transparent`}>
              <Scan className="w-4 h-4" /> <span className="hidden sm:inline">Scanner</span>
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" className={`gap-2 py-2.5 border rounded-lg transition-all ${darkMode ? "data-[state=active]:bg-cyan-900/20 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-900/40" : "data-[state=active]:bg-cyan-100 data-[state=active]:text-cyan-600 data-[state=active]:border-cyan-300"} border-transparent`}>
                <Users className="w-4 h-4" /> <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
            )}
          </TabsList>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <TabsContent value="scanner"><AIScanner /></TabsContent>
            {isAdmin && <TabsContent value="users"><UserManagement user={user} /></TabsContent>}
          </motion.div>
        </Tabs>
      </div>
    </div>
  );
}