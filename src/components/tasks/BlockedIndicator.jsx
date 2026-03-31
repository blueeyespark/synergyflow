import { AlertCircle, Lock } from "lucide-react";

export default function BlockedIndicator({ isBlocked, blockedBy = [] }) {
  if (!isBlocked) return null;

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-200 rounded-md">
      <Lock className="w-3 h-3 text-amber-600" />
      <span className="text-xs font-medium text-amber-700">
        {blockedBy.length > 0 ? `Blocked (${blockedBy.length})` : "Blocked"}
      </span>
    </div>
  );
}