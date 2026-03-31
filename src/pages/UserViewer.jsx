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
  const [selectedUserEmail, setSelectedUserEmail] = useState(null);
  const [selectedUserData, setSelectedUserData] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user?.email,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list("-created_date"),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => base44.entities.Task.list("-created_date"),
  });

  // Filter data for selected user
  const userProjects = selectedUserEmail 
    ? projects.filter(p =>
        p.owner_email === selectedUserEmail || p.team_members?.includes(selectedUserEmail)
      )
    : [];

  const userTasks = selectedUserEmail
    ? tasks.filter(t => {
        const project = userProjects.find(p => p.id === t.project_id);
        return project && (t.assigned_to === selectedUserEmail || !t.assigned_to);
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
          <p className="text-slate-600 mb-4">Only admins can view other users' perspectives</p>
          <Link to={createPageUrl("Dashboard")}>
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!selectedUserEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="outline" className="mb-4 gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">User Viewer</h1>
            <p className="text-slate-600">Select a user to view their dashboard</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allUsers.filter(u => u.email !== user?.email).map((u, idx) => (
              <motion.button
                key={u.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedUserEmail(u.email)}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {u.full_name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{u.full_name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 capitalize">{u.role}</p>
              </motion.button>
            ))}
          </div>

          {allUsers.length <= 1 && (
            <div className="text-center py-12">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400">No other users to view</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const viewedUser = allUsers.find(u => u.email === selectedUserEmail);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <Button 
              variant="outline" 
              onClick={() => setSelectedUserEmail(null)}
              className="mb-4 gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Users
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">
              Viewing: {viewedUser?.full_name}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">{viewedUser?.email}</p>
          </div>
          <div className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            👁️ Admin View
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