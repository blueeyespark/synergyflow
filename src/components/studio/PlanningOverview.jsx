import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { FolderKanban, CheckSquare, Clock, AlertTriangle, Calendar, Users, Zap, BarChart3 } from "lucide-react";
import { isPast, isToday, isBefore, addDays, format } from "date-fns";
import StatsCard from "@/components/dashboard/StatsCard";
import UpcomingTasks from "@/components/dashboard/UpcomingTasks";
import ProjectsOverview from "@/components/dashboard/ProjectsOverview";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PlanningOverview() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", user?.email],
    queryFn: () => base44.entities.Project.list("-created_date"),
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", user?.email],
    queryFn: () => base44.entities.Task.list("-created_date"),
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000,
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ["meetings", user?.email],
    queryFn: () => base44.entities.Meeting?.list?.("-created_date") || [],
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["templates", user?.email],
    queryFn: () => base44.entities.ContentTemplate?.list?.("-created_date") || [],
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000,
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ["schedules", user?.email],
    queryFn: () => base44.entities.Schedule?.list?.("-scheduled_date") || [],
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000,
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ["time-entries", user?.email],
    queryFn: () => base44.entities.TimeEntry?.list?.("-date") || [],
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000,
  });

  const myProjects = useMemo(() => projects.filter(
    (p) => p.owner_email === user?.email || p.team_members?.includes(user?.email)
  ), [projects, user?.email]);

  const myTasks = useMemo(() => tasks.filter((t) => {
    const project = myProjects.find((p) => p.id === t.project_id);
    return project && (t.assigned_to === user?.email || !t.assigned_to);
  }), [tasks, myProjects, user?.email]);

  const myMeetings = useMemo(() => meetings.filter((m) => m.attendees?.includes(user?.email) || m.organizer_email === user?.email), [meetings, user?.email]);

  const activeProjects = myProjects.filter((p) => p.status !== "completed").length;
  const completedTasks = myTasks.filter((t) => t.status === "completed").length;
  const overdueTasks = myTasks.filter(
    (t) =>
      t.due_date &&
      isPast(new Date(t.due_date + "T12:00:00")) &&
      !isToday(new Date(t.due_date + "T12:00:00")) &&
      t.status !== "completed"
  ).length;
  const upcomingDeadlines = myTasks.filter(
    (t) =>
      t.due_date &&
      t.status !== "completed" &&
      isBefore(new Date(t.due_date + "T12:00:00"), addDays(new Date(), 7))
  ).length;

  const urgentTasks = myTasks
    .filter((t) => t.status !== "completed")
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date) - new Date(b.due_date);
    })
    .slice(0, 5);

  const upcomingMeetings = myMeetings
    .filter((m) => new Date(m.scheduled_time) > new Date())
    .sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time))
    .slice(0, 3);

  const totalTimeLogged = timeEntries.reduce((sum, t) => sum + (t.duration_minutes || 0), 0);
  const weekTimeLogged = timeEntries
    .filter((t) => {
      const entryDate = new Date(t.date);
      const weekAgo = addDays(new Date(), -7);
      return entryDate > weekAgo;
    })
    .reduce((sum, t) => sum + (t.duration_minutes || 0), 0);

  return (
    <div className="space-y-6">
      {/* Master Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatsCard title="Active Projects" value={activeProjects} icon={FolderKanban} color="bg-indigo-500" />
        <StatsCard title="Tasks Completed" value={completedTasks} icon={CheckSquare} color="bg-green-500" subtitle={`of ${myTasks.length}`} />
        <StatsCard title="Due This Week" value={upcomingDeadlines} icon={Clock} color="bg-amber-500" />
        <StatsCard title="Overdue" value={overdueTasks} icon={AlertTriangle} color="bg-red-500" />
        <StatsCard title="Meetings" value={myMeetings.length} icon={Users} color="bg-blue-500" />
      </div>

      {overdueTasks > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">
            <span className="font-semibold">{overdueTasks} overdue task{overdueTasks > 1 ? "s" : ""}</span> need your attention
          </p>
        </div>
      )}

      {/* Core Planning Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-slate-100 dark:border-zinc-700 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" /> Upcoming Tasks
          </h3>
          {urgentTasks.length > 0 ? (
            <UpcomingTasks tasks={urgentTasks} onTaskClick={() => {}} />
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No upcoming tasks</p>
          )}
        </div>

        {/* Projects Overview */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-slate-100 dark:border-zinc-700 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-indigo-500" /> Projects
          </h3>
          {myProjects.length > 0 ? (
            <ProjectsOverview projects={myProjects} tasks={tasks} />
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No projects created</p>
          )}
        </div>
      </div>

      {/* Meetings + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-500" /> Upcoming Meetings
          </h3>
          {upcomingMeetings.length > 0 ? (
            <div className="space-y-2.5">
              {upcomingMeetings.map((m) => (
                <div key={m.id} className="p-3 border border-slate-200 dark:border-zinc-700 rounded-lg">
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{m.title || "Meeting"}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{format(new Date(m.scheduled_time), "MMM d, h:mm a")}</p>
                  {m.attendees && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{m.attendees.length} attendees</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No upcoming meetings</p>
          )}
        </Card>

        {/* Time Tracking Summary */}
        <Card className="p-5">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-500" /> Time Tracking
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">This Week</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white">{Math.round(weekTimeLogged / 60)}h {weekTimeLogged % 60}m</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">All Time</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white">{Math.round(totalTimeLogged / 60)}h {totalTimeLogged % 60}m</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Content Templates */}
      <Card className="p-5">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" /> Content Templates ({templates.length})
        </h3>
        {templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.slice(0, 6).map((t) => (
              <div key={t.id} className="p-3 border border-slate-200 dark:border-zinc-700 rounded-lg">
                <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{t.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.type}</p>
                {t.usage_count && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Used {t.usage_count} times</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No templates created</p>
        )}
      </Card>

      {/* Scheduled Content */}
      <Card className="p-5">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-green-500" /> Scheduled Content ({schedules.length})
        </h3>
        {schedules.filter((s) => s.status === "scheduled").length > 0 ? (
          <div className="space-y-2.5">
            {schedules.filter((s) => s.status === "scheduled").slice(0, 5).map((s) => (
              <div key={s.id} className="p-3 border border-slate-200 dark:border-zinc-700 rounded-lg">
                <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{s.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{format(new Date(s.scheduled_date), "MMM d, h:mm a")}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No scheduled content</p>
        )}
      </Card>

      {/* Activity Feed */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-slate-100 dark:border-zinc-700 p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-green-500" /> Activity Feed
        </h3>
        <ActivityFeed projects={myProjects} userEmail={user?.email} />
      </div>
    </div>
  );
}