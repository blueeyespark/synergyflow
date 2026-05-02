import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, ArrowLeft, CheckSquare, Clock, AlertTriangle, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { isPast, isToday, addDays, isBefore } from "date-fns";
import StatsCard from "@/components/dashboard/StatsCard";
import UpcomingTasks from "@/components/dashboard/UpcomingTasks";
import ProjectsOverview from "@/components/dashboard/ProjectsOverview";
import ActivityFeed from "@/components/dashboard/ActivityFeed";

export default function UserViewer() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user?.email && user?.role === 'admin',
  });

  // Get default user (first non-admin user)
  const defaultUser = allUsers.find(u => u.role !== 'admin' && u.email !== user?.email);
  const selectedUserEmail = defaultUser?.email;
  const viewedUser = defaultUser;

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list("-created_date"),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.list("-created_date"),
  });

  // Filter data for default user
  const userProjects = defaultUser
    ? projects.filter(p =>
        p.owner_email === defaultUser.email || p.team_members?.includes(defaultUser.email)
      )
    : [];

  const userTasks = defaultUser
    ? tasks.filter(t => {
        const project = userProjects.find(p => p.id === t.project_id);
        return project && (t.assigned_to === defaultUser.email || !t.assigned_to);
      })
    : [];

  const activeProjects = userProjects.filter(p => p.status !== 'completed').length;
  const completedTasks = userTasks.filter(t => t.status === 'completed').length;
  const overdueTasks = userTasks.filter(t =>
    t.due_date && isPast(new Date(t.due_date + 'T12:00:00')) && !isToday(new Date(t.due_date + 'T12:00:00')) && t.status !== 'completed'
  ).length;

  const urgentTasks = userTasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date) - new Date(b.due_date);
    });

  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-4">Only admins can view user perspectives</p>
          <Link to={createPageUrl("Dashboard")}>
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!defaultUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Users Available</h2>
          <p className="text-slate-600 mb-4">There are no other users to view</p>
          <Link to={createPageUrl("Dashboard")}>
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="outline" className="mb-4 gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">
              User View: {viewedUser?.full_name}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">{viewedUser?.email}</p>
          </div>
          <div className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            👁️ Admin Monitoring
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatsCard title="Active Projects" value={activeProjects} icon={FolderKanban} color="bg-indigo-500" />
          <StatsCard title="Completed Tasks" value={completedTasks} icon={CheckSquare} color="bg-green-500" subtitle={`of ${userTasks.length}`} />
          <StatsCard title="Overdue" value={overdueTasks} icon={AlertTriangle} color="bg-red-500" />
        </motion.div>

        {/* Upcoming Tasks */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Upcoming Tasks</h3>
          <UpcomingTasks tasks={urgentTasks} onTaskClick={() => {}} />
        </div>

        {/* Projects Overview */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Projects</h3>
          <ProjectsOverview projects={userProjects} tasks={tasks} />
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <ActivityFeed projects={userProjects} userEmail={selectedUserEmail} />
        </div>
      </div>
    </div>
  );
}