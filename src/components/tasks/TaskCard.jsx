import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, Pencil, Trash2, Calendar, User,
  Circle, ArrowRight, Eye, CheckCircle2, Lock, Link2
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const priorityColors = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700"
};

const statusIcons = {
  todo: Circle,
  in_progress: ArrowRight,
  review: Eye,
  completed: CheckCircle2
};

export default function TaskCard({ task, onEdit, onDelete, onStatusChange, index, allTasks, isBlocked, blockingTasks }) {
  const StatusIcon = statusIcons[task.status];
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && task.status !== 'completed';
  const hasDependencies = task.depends_on && task.depends_on.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.03 }}
      layout
      className={`group bg-white rounded-xl border p-4 hover:shadow-md transition-all ${
        isBlocked ? 'border-amber-200 bg-amber-50/30' :
        isOverdue ? 'border-red-200 bg-red-50/30' : 'border-slate-100'
      }`}
    >
      <div className="flex items-start gap-3">
        <TooltipProvider>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className={`mt-0.5 p-1 rounded-lg transition-colors relative ${
                  isBlocked ? 'text-amber-500 hover:bg-amber-100' :
                  task.status === 'completed' ? 'text-green-500 hover:bg-green-100' : 
                  'text-slate-400 hover:bg-slate-100'
                }`}
                disabled={isBlocked && task.status !== 'completed'}
              >
                {isBlocked && task.status !== 'completed' ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="relative">
                        <StatusIcon className="w-5 h-5" />
                        <Lock className="w-3 h-3 absolute -bottom-0.5 -right-0.5 bg-white rounded-full" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Blocked by dependencies</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <StatusIcon className="w-5 h-5" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem 
                onClick={() => onStatusChange(task, "todo")}
                disabled={isBlocked}
              >
                <Circle className="w-4 h-4 mr-2 text-slate-400" />
                To Do
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onStatusChange(task, "in_progress")}
                disabled={isBlocked}
              >
                <ArrowRight className="w-4 h-4 mr-2 text-blue-500" />
                In Progress
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onStatusChange(task, "review")}
                disabled={isBlocked}
              >
                <Eye className="w-4 h-4 mr-2 text-amber-500" />
                Review
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(task, "completed")}>
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                Completed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipProvider>

        <div className="flex-1 min-w-0">
          <p className={`font-medium ${
            task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'
          }`}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{task.description}</p>
          )}
          {isBlocked && (
            <div className="flex items-center gap-2 mt-2 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
              <Lock className="w-3 h-3" />
              <span>Blocked by {blockingTasks?.length || 0} incomplete {blockingTasks?.length === 1 ? 'task' : 'tasks'}</span>
            </div>
          )}
          {hasDependencies && !isBlocked && (
            <div className="flex items-center gap-2 mt-2 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-md">
              <CheckCircle2 className="w-3 h-3" />
              <span>All dependencies completed</span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Badge variant="secondary" className={priorityColors[task.priority]}>
              {task.priority}
            </Badge>
            {task.due_date && (
              <span className={`text-xs flex items-center gap-1 ${
                isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'
              }`}>
                <Calendar className="w-3 h-3" />
                {format(new Date(task.due_date), "MMM d")}
              </span>
            )}
            {task.assigned_to && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <User className="w-3 h-3" />
                {task.assigned_to.split('@')[0]}
              </span>
            )}
            {hasDependencies && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Link2 className="w-3 h-3" />
                      {task.depends_on.length}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs font-medium mb-1">Depends on:</p>
                    <ul className="text-xs space-y-0.5">
                      {task.depends_on.map(depId => {
                        const depTask = allTasks?.find(t => t.id === depId);
                        return depTask ? (
                          <li key={depId} className="flex items-center gap-1">
                            {depTask.status === 'completed' ? '✓' : '○'} {depTask.title}
                          </li>
                        ) : null;
                      })}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(task)} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}