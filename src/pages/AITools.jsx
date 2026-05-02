import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scan, Bug, History, Users } from "lucide-react";
import { motion } from "framer-motion";
import AIScanner from "./AIScanner";
import AIBugMonitor from "./AIBugMonitor";
import AIChangesLog from "./AIChangesLog";
import UserViewer from "./UserViewer";
import AITokenGate from "@/components/aitools/AITokenGate";
import StaffManager from "@/components/aitools/StaffManager";

export default function AITools() {
  const [user, setUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [tab, setTab] = useState("scanner");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Admins bypass the gate automatically
  const isAdmin = user?.role === "admin";
  const hasAccess = isAdmin || !!sessionToken;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#03080f] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1e78ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    return <AITokenGate user={user} onGranted={setSessionToken} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50/30 dark:from-slate-900 dark:to-purple-950/20">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Staff Tools</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Scanner · Bug Monitor · Changes Log · Users</p>
        </motion.div>

        {/* Admin-only: manage approved staff */}
        {isAdmin && <StaffManager currentUser={user} />}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-xl">
            <TabsTrigger value="scanner" className="gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
              <Scan className="w-4 h-4" /> AI Scanner
            </TabsTrigger>
            <TabsTrigger value="bugs" className="gap-2 data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
              <Bug className="w-4 h-4" /> Bug Monitor
            </TabsTrigger>
            <TabsTrigger value="changes" className="gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              <History className="w-4 h-4" /> Changes Log
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <Users className="w-4 h-4" /> Users
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="scanner"><AIScanner /></TabsContent>
          <TabsContent value="bugs"><AIBugMonitor /></TabsContent>
          <TabsContent value="changes"><AIChangesLog /></TabsContent>
          {isAdmin && <TabsContent value="users"><UserViewer /></TabsContent>}
        </Tabs>
      </div>
    </div>
  );
}