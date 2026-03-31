import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { History, Trash2, Code, Globe, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, parseISO } from "date-fns";

const SOURCE_LABELS = {
  self_scan: { label: "Self Scan", color: "bg-purple-100 text-purple-700", icon: Sparkles },
  external_scan: { label: "External Scan", color: "bg-blue-100 text-blue-700", icon: Globe },
};

const TYPE_COLORS = {
  ux_improvement: "bg-amber-100 text-amber-700",
  feature: "bg-green-100 text-green-700",
  bug_fix: "bg-red-100 text-red-700",
  other: "bg-slate-100 text-slate-700",
};

function ChangeCard({ change, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const src = SOURCE_LABELS[change.source] || SOURCE_LABELS.self_scan;
  const SrcIcon = src.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge className={`text-xs ${src.color}`}><SrcIcon className="w-3 h-3 mr-1" />{src.label}</Badge>
            <Badge className={`text-xs ${TYPE_COLORS[change.change_type] || TYPE_COLORS.other}`}>{change.change_type?.replace("_", " ")}</Badge>
            {change.origin_site && <span className="text-xs text-slate-400">from {change.origin_site}</span>}
          </div>
          <p className="font-medium text-sm text-slate-800 dark:text-slate-100">{change.title}</p>
          {change.file_path && (
            <p className="text-xs text-indigo-500 mt-0.5 font-mono">{change.file_path}</p>
          )}
          {change.explanation && (
            <p className="text-xs text-slate-500 mt-1">{change.explanation}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-slate-400">
              {change.applied_by && `by ${change.applied_by} · `}
              {change.created_date ? formatDistanceToNow(parseISO(change.created_date), { addSuffix: true }) : ""}
            </span>
            {change.code_snippet && (
              <button onClick={() => setExpanded(!expanded)} className="text-xs text-indigo-500 flex items-center gap-1">
                <Code className="w-3 h-3" /> {expanded ? "Hide" : "View"} code
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400 hover:text-red-500 flex-shrink-0" onClick={() => onDelete(change.id)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
      {expanded && change.code_snippet && (
        <pre className="mt-3 bg-slate-900 text-slate-100 rounded-lg p-3 text-xs overflow-x-auto max-h-64 whitespace-pre-wrap">
          {change.code_snippet}
        </pre>
      )}
    </motion.div>
  );
}

export default function AIChangesLog() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: changes = [], isLoading } = useQuery({
    queryKey: ["ai-changes"],
    queryFn: () => base44.entities.AIAppliedChange.list("-created_date", 200),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AIAppliedChange.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-changes"] }),
  });

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50/30 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <History className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">AI Changes Log</h1>
            <p className="text-sm text-slate-500">{changes.length} auto-applied changes tracked</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse bg-white rounded-xl" />)}</div>
        ) : changes.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No AI changes applied yet. Use the AI Scanner to auto-apply improvements.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {changes.map(change => (
              <ChangeCard key={change.id} change={change} onDelete={(id) => deleteMutation.mutate(id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}