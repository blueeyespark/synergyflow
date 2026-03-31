import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scan, Bug, History } from "lucide-react";

// ── Lazy-load sub-pages as inline imports ──
import AIScanner from "./AIScanner";
import AIBugMonitor from "./AIBugMonitor";
import AIChangesLog from "./AIChangesLog";

export default function AITools() {
  const [tab, setTab] = useState("scanner");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50/30 dark:from-slate-900 dark:to-purple-950/20">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">AI Tools</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Scanner · Bug Monitor · Changes Log</p>
        </motion.div>

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
          </TabsList>

          <TabsContent value="scanner">
            <AIScanner />
          </TabsContent>
          <TabsContent value="bugs">
            <AIBugMonitor />
          </TabsContent>
          <TabsContent value="changes">
            <AIChangesLog />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}