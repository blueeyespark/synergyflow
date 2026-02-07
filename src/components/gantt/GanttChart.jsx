import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  format, differenceInDays, addDays, startOfWeek, 
  endOfWeek, eachDayOfInterval, isToday, isSameDay,
  parseISO, min, max
} from "date-fns";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const priorityColors = {
  low: { bg: "bg-slate-400", border: "border-slate-500" },
  medium: { bg: "bg-blue-500", border: "border-blue-600" },
  high: { bg: "bg-amber-500", border: "border-amber-600" },
  urgent: { bg: "bg-red-500", border: "border-red-600" }
};

const statusOpacity = {
  todo: "opacity-60",
  in_progress: "opacity-100",
  review: "opacity-80",
  completed: "opacity-40"
};

export default function GanttChart({ tasks, onTaskUpdate }) {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(40); // pixels per day
  const [viewStart, setViewStart] = useState(() => {
    const today = new Date();
    return addDays(startOfWeek(today), -7);
  });

  const viewDays = Math.ceil((containerRef.current?.clientWidth || 800) / zoom) + 14;
  const viewEnd = addDays(viewStart, viewDays);
  const days = eachDayOfInterval({ start: viewStart, end: viewEnd });

  const getTaskPosition = (task) => {
    const start = task.start_date ? parseISO(task.start_date) : parseISO(task.created_date?.split('T')[0] || new Date().toISOString().split('T')[0]);
    const end = task.due_date ? parseISO(task.due_date) : addDays(start, 1);
    
    const left = differenceInDays(start, viewStart) * zoom;
    const width = Math.max((differenceInDays(end, start) + 1) * zoom - 4, zoom - 4);
    
    return { left, width, start, end };
  };

  const handleBarDrag = (task, deltaX) => {
    const daysMoved = Math.round(deltaX / zoom);
    if (daysMoved === 0) return;

    const currentStart = task.start_date ? parseISO(task.start_date) : new Date();
    const currentEnd = task.due_date ? parseISO(task.due_date) : addDays(currentStart, 1);
    
    const newStart = addDays(currentStart, daysMoved);
    const newEnd = addDays(currentEnd, daysMoved);

    onTaskUpdate(task.id, {
      start_date: format(newStart, 'yyyy-MM-dd'),
      due_date: format(newEnd, 'yyyy-MM-dd')
    });
  };

  const handleBarResize = (task, deltaX, edge) => {
    const daysMoved = Math.round(deltaX / zoom);
    if (daysMoved === 0) return;

    const currentStart = task.start_date ? parseISO(task.start_date) : new Date();
    const currentEnd = task.due_date ? parseISO(task.due_date) : addDays(currentStart, 1);

    if (edge === 'left') {
      const newStart = addDays(currentStart, daysMoved);
      if (newStart < currentEnd) {
        onTaskUpdate(task.id, { start_date: format(newStart, 'yyyy-MM-dd') });
      }
    } else {
      const newEnd = addDays(currentEnd, daysMoved);
      if (newEnd > currentStart) {
        onTaskUpdate(task.id, { due_date: format(newEnd, 'yyyy-MM-dd') });
      }
    }
  };

  const scrollTimeline = (direction) => {
    const daysToScroll = direction * 7;
    setViewStart(addDays(viewStart, daysToScroll));
  };

  const goToToday = () => {
    setViewStart(addDays(startOfWeek(new Date()), -7));
  };

  // Render dependency lines
  const renderDependencyLines = () => {
    const lines = [];
    tasks.forEach(task => {
      if (task.depends_on && task.depends_on.length > 0) {
        task.depends_on.forEach(depId => {
          const depTask = tasks.find(t => t.id === depId);
          if (depTask) {
            const taskIndex = tasks.indexOf(task);
            const depIndex = tasks.indexOf(depTask);
            const taskPos = getTaskPosition(task);
            const depPos = getTaskPosition(depTask);

            const x1 = depPos.left + depPos.width;
            const y1 = depIndex * 48 + 24;
            const x2 = taskPos.left;
            const y2 = taskIndex * 48 + 24;

            lines.push(
              <svg
                key={`${depId}-${task.id}`}
                className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible"
                style={{ zIndex: 1 }}
              >
                <path
                  d={`M ${x1} ${y1} C ${x1 + 20} ${y1}, ${x2 - 20} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                  markerEnd="url(#arrowhead)"
                />
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M 0 0 L 6 3 L 0 6 Z" fill="#94a3b8" />
                  </marker>
                </defs>
              </svg>
            );
          }
        });
      }
    });
    return lines;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header Controls */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Gantt Chart</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => scrollTimeline(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => scrollTimeline(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-slate-200 mx-2" />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setZoom(Math.max(20, zoom - 10))}
            disabled={zoom <= 20}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setZoom(Math.min(80, zoom + 10))}
            disabled={zoom >= 80}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Task Names Column */}
        <div className="w-48 flex-shrink-0 border-r border-slate-100">
          <div className="h-12 border-b border-slate-100 bg-slate-50 px-3 flex items-center">
            <span className="text-xs font-medium text-slate-500">Task</span>
          </div>
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className="h-12 px-3 flex items-center border-b border-slate-50 hover:bg-slate-50"
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm truncate cursor-default">
                      {task.title}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{task.title}</p>
                    {task.depends_on?.length > 0 && (
                      <p className="text-xs text-slate-400 mt-1">
                        <Link2 className="w-3 h-3 inline mr-1" />
                        {task.depends_on.length} dependencies
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </div>

        {/* Timeline Area */}
        <div className="flex-1 overflow-x-auto" ref={containerRef}>
          {/* Date Headers */}
          <div className="h-12 border-b border-slate-100 bg-slate-50 flex">
            {days.map((day) => (
              <div
                key={day.toISOString()}
                style={{ width: zoom, minWidth: zoom }}
                className={`flex-shrink-0 flex flex-col items-center justify-center border-r border-slate-100 ${
                  isToday(day) ? 'bg-indigo-50' : ''
                }`}
              >
                <span className="text-[10px] text-slate-400">
                  {format(day, 'EEE')}
                </span>
                <span className={`text-xs font-medium ${
                  isToday(day) ? 'text-indigo-600' : 'text-slate-600'
                }`}>
                  {format(day, 'd')}
                </span>
              </div>
            ))}
          </div>

          {/* Task Bars */}
          <div className="relative" style={{ width: days.length * zoom }}>
            {/* Grid lines */}
            <div className="absolute inset-0 flex">
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  style={{ width: zoom }}
                  className={`flex-shrink-0 border-r border-slate-50 h-full ${
                    isToday(day) ? 'bg-indigo-50/30' : ''
                  }`}
                />
              ))}
            </div>

            {/* Today marker */}
            {days.some(d => isToday(d)) && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-indigo-500 z-10"
                style={{ left: differenceInDays(new Date(), viewStart) * zoom + zoom / 2 }}
              />
            )}

            {/* Dependency lines */}
            {renderDependencyLines()}

            {/* Task rows */}
            {tasks.map((task, index) => {
              const { left, width } = getTaskPosition(task);
              const colors = priorityColors[task.priority] || priorityColors.medium;

              return (
                <div
                  key={task.id}
                  className="h-12 relative border-b border-slate-50"
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div
                          className={`absolute top-2 h-8 rounded-md ${colors.bg} ${statusOpacity[task.status]} cursor-move group flex items-center px-2 shadow-sm border ${colors.border}`}
                          style={{ left: Math.max(0, left), width: Math.max(width, 20) }}
                          drag="x"
                          dragConstraints={{ left: 0, right: 0 }}
                          dragElastic={0}
                          dragMomentum={false}
                          onDragEnd={(e, info) => handleBarDrag(task, info.offset.x)}
                        >
                          {width > 60 && (
                            <span className="text-xs text-white truncate font-medium">
                              {task.title}
                            </span>
                          )}
                          
                          {/* Resize handles */}
                          <div
                            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              const startX = e.clientX;
                              const onMouseMove = (e) => {
                                const delta = e.clientX - startX;
                                if (Math.abs(delta) > zoom / 2) {
                                  handleBarResize(task, delta, 'left');
                                }
                              };
                              const onMouseUp = () => {
                                window.removeEventListener('mousemove', onMouseMove);
                                window.removeEventListener('mouseup', onMouseUp);
                              };
                              window.addEventListener('mousemove', onMouseMove);
                              window.addEventListener('mouseup', onMouseUp);
                            }}
                          />
                          <div
                            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              const startX = e.clientX;
                              const onMouseMove = (e) => {
                                const delta = e.clientX - startX;
                                if (Math.abs(delta) > zoom / 2) {
                                  handleBarResize(task, delta, 'right');
                                }
                              };
                              const onMouseUp = () => {
                                window.removeEventListener('mousemove', onMouseMove);
                                window.removeEventListener('mouseup', onMouseUp);
                              };
                              window.addEventListener('mousemove', onMouseMove);
                              window.addEventListener('mouseup', onMouseUp);
                            }}
                          />
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <p className="font-medium">{task.title}</p>
                          <p className="text-slate-400 mt-1">
                            {task.start_date && format(parseISO(task.start_date), 'MMM d')}
                            {task.start_date && task.due_date && ' → '}
                            {task.due_date && format(parseISO(task.due_date), 'MMM d')}
                          </p>
                          <p className="mt-1 capitalize">{task.status.replace('_', ' ')}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {tasks.length === 0 && (
        <div className="p-8 text-center text-slate-500">
          No tasks to display
        </div>
      )}
    </div>
  );
}