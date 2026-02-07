import { motion } from "framer-motion";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const priorityColors = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700"
};

export default function UpcomingTasks({ tasks, onTaskClick }) {
  const formatDueDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "MMM d");
  };

  const isOverdue = (date) => date && isPast(new Date(date)) && !isToday(new Date(date));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">Upcoming Tasks</h3>
        <p className="text-sm text-slate-500 mt-1">Tasks that need your attention</p>
      </div>
      <div className="divide-y divide-slate-50">
        {tasks.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">You're all caught up!</p>
            <p className="text-sm text-slate-400 mt-1">No upcoming tasks</p>
          </div>
        ) : (
          tasks.slice(0, 5).map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onTaskClick?.(task)}
              className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  isOverdue(task.due_date) ? 'bg-red-500' : 'bg-indigo-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className={priorityColors[task.priority]}>
                      {task.priority}
                    </Badge>
                    {task.due_date && (
                      <span className={`text-xs flex items-center gap-1 ${
                        isOverdue(task.due_date) ? 'text-red-600' : 'text-slate-500'
                      }`}>
                        {isOverdue(task.due_date) ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {formatDueDate(task.due_date)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}