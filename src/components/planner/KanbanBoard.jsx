import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { 
  RefreshCw, Link2, MessageSquare, Calendar, User, 
  AlertTriangle, MoreVertical, Edit2, Trash2, Image
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const priorityColors = {
  low: "border-l-blue-400",
  medium: "border-l-amber-400",
  high: "border-l-orange-500",
  urgent: "border-l-red-500"
};

const priorityBadges = {
  low: "bg-blue-50 text-blue-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-orange-50 text-orange-700",
  urgent: "bg-red-50 text-red-700"
};

export default function KanbanBoard({ 
  statuses, 
  tasks, 
  onTaskMove, 
  onTaskClick, 
  onTaskEdit, 
  onTaskDelete,
  canEdit,
  getTaskCommentCount,
  isTaskBlocked
}) {
  const tasksByStatus = statuses.reduce((acc, status) => {
    acc[status.id] = tasks.filter(t => (t.status || 'todo') === status.id);
    return acc;
  }, {});

  const handleDragEnd = (result) => {
    if (!result.destination || !canEdit) return;
    
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    
    onTaskMove(draggableId, newStatus, destination.index);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
        {statuses.map(status => (
          <div key={status.id} className="flex-shrink-0 w-80">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 sticky top-0 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 py-2">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full shadow-sm" 
                  style={{ backgroundColor: status.color }} 
                />
                <h3 className="font-semibold text-slate-900">{status.name}</h3>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                  {tasksByStatus[status.id]?.length || 0}
                </span>
              </div>
            </div>
            
            {/* Droppable Column */}
            <Droppable droppableId={status.id} isDropDisabled={!canEdit}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-3 min-h-[400px] p-2 rounded-xl transition-colors ${
                    snapshot.isDraggingOver ? 'bg-indigo-50/50 ring-2 ring-indigo-200' : 'bg-slate-50/50'
                  }`}
                >
                  <AnimatePresence>
                    {tasksByStatus[status.id]?.map((task, index) => (
                      <Draggable 
                        key={task.id} 
                        draggableId={task.id} 
                        index={index}
                        isDragDisabled={!canEdit}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <TaskCard
                              task={task}
                              isDragging={snapshot.isDragging}
                              onClick={() => onTaskClick(task)}
                              onEdit={canEdit ? () => onTaskEdit(task) : undefined}
                              onDelete={canEdit ? () => onTaskDelete(task.id) : undefined}
                              commentCount={getTaskCommentCount?.(task.id) || 0}
                              isBlocked={isTaskBlocked?.(task)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </AnimatePresence>
                  {provided.placeholder}
                  
                  {tasksByStatus[status.id]?.length === 0 && (
                    <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center">
                      <p className="text-sm text-slate-400">Drop tasks here</p>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}

function TaskCard({ task, isDragging, onClick, onEdit, onDelete, commentCount, isBlocked }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group bg-white rounded-xl border-l-4 ${priorityColors[task.priority]} shadow-sm hover:shadow-md transition-all cursor-pointer ${
        isDragging ? 'shadow-xl rotate-2 scale-105' : ''
      } ${isBlocked ? 'opacity-60' : ''}`}
      onClick={onClick}
    >
      <div className="p-4">
        {/* Indicators Row */}
        <div className="flex items-center gap-1.5 mb-2">
          {task.recurring?.enabled && (
            <div className="p-1 bg-indigo-100 rounded" title="Recurring task">
              <RefreshCw className="w-3 h-3 text-indigo-600" />
            </div>
          )}
          {task.depends_on?.length > 0 && (
            <div className={`p-1 rounded ${isBlocked ? 'bg-amber-100' : 'bg-green-100'}`} title={isBlocked ? "Blocked by dependencies" : "Has dependencies"}>
              <Link2 className={`w-3 h-3 ${isBlocked ? 'text-amber-600' : 'text-green-600'}`} />
            </div>
          )}
          {task.image_urls?.length > 0 && (
            <div className="p-1 bg-purple-100 rounded" title="Has attachments">
              <Image className="w-3 h-3 text-purple-600" />
            </div>
          )}
          {isBlocked && (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
              Blocked
            </Badge>
          )}
        </div>

        {/* Title & Actions */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-slate-900 line-clamp-2">{task.title}</h4>
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 -mr-2 -mt-1">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {task.description && (
          <p className="text-sm text-slate-500 line-clamp-2 mt-1">{task.description}</p>
        )}

        {/* Steps Progress */}
        {task.steps?.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Subtasks</span>
              <span>{task.steps.filter(s => s.completed).length}/{task.steps.length}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${(task.steps.filter(s => s.completed).length / task.steps.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${priorityBadges[task.priority]}`}>
              {task.priority}
            </Badge>
            {task.due_date && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(task.due_date), 'MMM d')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {commentCount > 0 && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {commentCount}
              </span>
            )}
            {task.assigned_to && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium" title={task.assigned_to}>
                {task.assigned_to.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}