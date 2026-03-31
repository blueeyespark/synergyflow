import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  addMonths, subMonths, addYears, subYears, startOfYear, endOfYear,
  eachMonthOfInterval
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Share2, Download, Edit2 } from "lucide-react";
import GoogleCalendarImport from "@/components/calendar/GoogleCalendarImport";
import QuickScheduleModal from "@/components/calendar/QuickScheduleModal";
import EventActionsModal from "@/components/calendar/EventActionsModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

const priorityColors = {
  low: "bg-slate-400",
  medium: "bg-blue-500",
  high: "bg-amber-500",
  urgent: "bg-red-500"
};

export default function CalendarPage() {
  const [user, setUser] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [showGCalImport, setShowGCalImport] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventType, setEventType] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const { refetch: refetchTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-due_date'),
  });
  const { refetch: refetchMeetings } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => base44.entities.Meeting.list('-date'),
  });

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: tasks = [], refetch: refetchTasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-due_date'),
  });

  const { data: meetings = [], refetch: refetchMeetingsData } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => base44.entities.Meeting.list('-date'),
  });

  const getTasksForDay = (day) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date + 'T12:00:00');
      return isSameDay(taskDate, day);
    });
  };

  const getMeetingsForDay = (day) => {
    return meetings.filter(meeting => {
      if (!meeting.date) return false;
      const meetingDate = new Date(meeting.date + 'T12:00:00');
      return isSameDay(meetingDate, day);
    });
  };

  const navigatePrev = () => {
    if (view === "day") setCurrentDate(subMonths(currentDate, 1));
    else if (view === "month") setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(subYears(currentDate, 1));
  };

  const navigateNext = () => {
    if (view === "day") setCurrentDate(addMonths(currentDate, 1));
    else if (view === "month") setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(addYears(currentDate, 1));
  };

  const renderDayView = () => {
    const dayTasks = getTasksForDay(currentDate);
    const dayMeetings = getMeetingsForDay(currentDate);
    
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h3 className="text-xl font-semibold mb-4">{format(currentDate, "EEEE, MMMM d, yyyy")}</h3>
        
        {dayMeetings.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-slate-500 mb-2">Meetings</h4>
            {dayMeetings.map((meeting) => (
              <div key={meeting.id} className="p-3 bg-indigo-50 rounded-lg mb-2 border-l-4 border-indigo-500 flex items-start justify-between group">
                <div>
                  <p className="font-medium">{meeting.title}</p>
                  <p className="text-sm text-slate-500">{meeting.start_time} - {meeting.end_time}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedEvent(meeting);
                    setEventType('meeting');
                    setShowEventModal(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-indigo-200 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {dayTasks.length > 0 ? (
          <div>
            <h4 className="text-sm font-medium text-slate-500 mb-2">Tasks Due</h4>
            {dayTasks.map((task) => (
              <div key={task.id} className="p-3 bg-slate-50 rounded-lg mb-2 flex items-center gap-3 justify-between group">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`} />
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-slate-500 capitalize">{task.status.replace('_', ' ')}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedEvent(task);
                    setEventType('task');
                    setShowEventModal(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">No tasks due on this day</p>
        )}
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-xs font-medium text-slate-500">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayTasks = getTasksForDay(day);
            const dayMeetings = getMeetingsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            
            return (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      onClick={() => {
                        setSelectedDate(day);
                        setShowScheduleModal(true);
                      }}
                      className={`min-h-24 p-2 border-b border-r border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${
                        !isCurrentMonth ? 'bg-slate-50/50' : ''
                      } ${isToday(day) ? 'bg-indigo-50/50' : ''}`}
                    >
                      <span className={`text-sm ${
                        isToday(day) 
                          ? 'bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center' 
                          : isCurrentMonth ? 'text-slate-900' : 'text-slate-400'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayTasks.slice(0, 2).map((task) => (
                          <div 
                            key={task.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(task);
                              setEventType('task');
                              setShowEventModal(true);
                            }}
                            className={`text-xs truncate px-1 py-0.5 rounded ${priorityColors[task.priority]} text-white cursor-pointer hover:opacity-80`}
                          >
                            {task.title}
                          </div>
                        ))}
                        {dayMeetings.slice(0, 1).map((meeting) => (
                          <div
                            key={meeting.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(meeting);
                              setEventType('meeting');
                              setShowEventModal(true);
                            }}
                            className="text-xs truncate px-1 py-0.5 rounded bg-indigo-500 text-white cursor-pointer hover:opacity-80"
                          >
                            {meeting.title}
                          </div>
                        ))}
                        {(dayTasks.length + dayMeetings.length) > 3 && (
                          <span className="text-xs text-slate-400">+{dayTasks.length + dayMeetings.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  {(dayTasks.length > 0 || dayMeetings.length > 0) && (
                    <TooltipContent>
                      <p className="font-medium">{format(day, 'MMM d')}</p>
                      <p className="text-xs">{dayTasks.length} tasks, {dayMeetings.length} meetings</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

    return (
      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        {months.map((month) => {
          const monthTasks = tasks.filter(t => t.due_date && isSameMonth(new Date(t.due_date + 'T12:00:00'), month));
          
          return (
            <div
              key={month.toISOString()}
              onClick={() => {
                setCurrentDate(month);
                setView("month");
              }}
              className="bg-white rounded-xl border border-slate-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <h4 className="font-medium text-slate-900">{format(month, 'MMMM')}</h4>
              <p className="text-sm text-slate-500 mt-1">{monthTasks.length} tasks</p>
              <div className="flex gap-1 mt-2">
                {monthTasks.slice(0, 4).map((t, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${priorityColors[t.priority]}`} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={navigatePrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {view === "year" 
                ? format(currentDate, 'yyyy')
                : view === "day"
                ? format(currentDate, 'MMMM d, yyyy')
                : format(currentDate, 'MMMM yyyy')
              }
            </h1>
            <Button variant="outline" size="icon" onClick={navigateNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Tabs value={view} onValueChange={setView}>
              <TabsList>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="year">Year</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm" onClick={() => setShowGCalImport(true)}>
              <Download className="w-4 h-4 mr-2" />
              Import Google
            </Button>
          </div>
        </motion.div>

        {view === "day" && renderDayView()}
        {view === "month" && renderMonthView()}
        {view === "year" && renderYearView()}

        <GoogleCalendarImport
          open={showGCalImport}
          onOpenChange={setShowGCalImport}
          onImported={() => setShowGCalImport(false)}
        />

        <QuickScheduleModal
          open={showScheduleModal}
          onOpenChange={setShowScheduleModal}
          selectedDate={selectedDate}
        />

        {selectedEvent && (
          <EventActionsModal
            open={showEventModal}
            onOpenChange={setShowEventModal}
            event={selectedEvent}
            type={eventType}
            onUpdate={() => {
              if (eventType === 'task') refetchTasksData();
              else refetchMeetingsData();
            }}
            onDelete={() => {
              if (eventType === 'task') refetchTasksData();
              else refetchMeetingsData();
            }}
          />
        )}
      </div>
    </div>
  );
}