import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { 
  History, Plus, Edit2, Trash2, Users, MessageSquare, 
  CheckCircle2, ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const actionIcons = {
  created: Plus,
  updated: Edit2,
  deleted: Trash2,
  status_changed: CheckCircle2,
  assigned: Users,
  commented: MessageSquare,
  shared: Users
};

const actionColors = {
  created: "bg-green-100 text-green-700",
  updated: "bg-blue-100 text-blue-700",
  deleted: "bg-red-100 text-red-700",
  status_changed: "bg-purple-100 text-purple-700",
  assigned: "bg-amber-100 text-amber-700",
  commented: "bg-indigo-100 text-indigo-700",
  shared: "bg-pink-100 text-pink-700"
};

export default function ActivityLogPanel({ open, onOpenChange, parentId, entityType }) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['activity-logs', parentId, entityType],
    queryFn: () => {
      if (parentId) {
        return base44.entities.ActivityLog.filter({ parent_id: parentId }, '-created_date', 100);
      } else if (entityType) {
        return base44.entities.ActivityLog.filter({ entity_type: entityType }, '-created_date', 100);
      }
      return [];
    },
    enabled: open && (!!parentId || !!entityType),
  });

  // Group logs by date
  const groupedLogs = logs.reduce((acc, log) => {
    const date = format(new Date(log.created_date), 'MMM d, yyyy');
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Activity Log
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          {isLoading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No activity yet</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedLogs).map(([date, dateLogs]) => (
                <div key={date}>
                  <h3 className="text-sm font-medium text-slate-500 mb-3 sticky top-0 bg-white py-1">
                    {date}
                  </h3>
                  <div className="space-y-3">
                    {dateLogs.map(log => {
                      const Icon = actionIcons[log.action] || Edit2;
                      return (
                        <div key={log.id} className="flex gap-3">
                          <div className={`p-2 rounded-lg h-fit ${actionColors[log.action]}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-medium">{log.user_name || log.user_email}</span>
                              {' '}{log.action.replace('_', ' ')}{' '}
                              <span className="font-medium">{log.entity_name || log.entity_type}</span>
                            </p>
                            
                            {/* Show changes */}
                            {log.changes && Object.keys(log.changes).length > 0 && (
                              <div className="mt-2 space-y-1">
                                {Object.entries(log.changes).map(([field, change]) => (
                                  <div key={field} className="flex items-center gap-2 text-xs">
                                    <span className="text-slate-500 capitalize">{field.replace('_', ' ')}:</span>
                                    <Badge variant="outline" className="text-xs">
                                      {String(change.from || '(empty)')}
                                    </Badge>
                                    <ArrowRight className="w-3 h-3 text-slate-400" />
                                    <Badge variant="outline" className="text-xs bg-green-50">
                                      {String(change.to || '(empty)')}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <p className="text-xs text-slate-400 mt-1">
                              {format(new Date(log.created_date), 'HH:mm')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}