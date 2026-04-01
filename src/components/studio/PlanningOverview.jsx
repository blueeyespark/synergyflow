import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { FolderKanban, CheckSquare, Clock, AlertTriangle } from "lucide-react";
import { isPast, isToday, isBefore, addDays } from "date-fns";
import StatsCard from "@/components/dashboard/StatsCard";
import UpcomingTasks from "@/components/dashboard/UpcomingTasks";
import ProjectsOverview from "@/components/dashboard/ProjectsOverview";
import ActivityFeed from "@/components/dashboard/ActivityFeed";

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

  const myProjects = projects.filter(
    (p) => p.owner_email === user?.email || p.team_members?.includes(user?.email)
  );

  const myTasks = tasks.filter((t) => {
    const project = myProjects.find((p) => p.id === t.project_id);
    return project && (t.assigned_to === user?.email || !t.assigned_to);
  });

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
    });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Active Projects" value={activeProjects} icon={FolderKanban} color="bg-indigo-500" />
        <StatsCard title="Completed Tasks" value={completedTasks} icon={CheckSquare} color="bg-green-500" subtitle={`of ${myTasks.length}`} />
        <StatsCard title="Due This Week" value={upcomingDeadlines} icon={Clock} color="bg-amber-500" />
        <StatsCard title="Overdue" value={overdueTasks} icon={AlertTriangle} color="bg-red-500" />
      </div>

      {overdueTasks > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">
            <span className="font-semibold">{overdueTasks} overdue task{overdueTasks > 1 ? "s" : ""}</span> need your attention
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" /> Upcoming Tasks
          </h3>
          <UpcomingTasks tasks={urgentTasks} onTaskClick={() => {}} />
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-indigo-500" /> Projects Overview
          </h3>
          <ProjectsOverview projects={myProjects} tasks={tasks} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-green-500" /> Activity Feed
        </h3>
        <ActivityFeed projects={myProjects} userEmail={user?.email} />
      </div>
    </div>
  );
}