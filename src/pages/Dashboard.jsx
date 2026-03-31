import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FolderKanban, CheckSquare, Clock, AlertTriangle, Brain, Settings, ChevronDown, ChevronRight } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { isPast, isToday, addDays, isBefore } from "date-fns";

import StatsCard from "@/components/dashboard/StatsCard";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import ProjectHealthMonitor from "@/components/ai/ProjectHealthMonitor";
import UpcomingTasks from "@/components/dashboard/UpcomingTasks";
import ProjectsOverview from "@/components/dashboard/ProjectsOverview";
import ProjectForm from "@/components/projects/ProjectForm";
import WorkspaceSelector from "@/components/workspace/WorkspaceSelector";
import WorkspaceSettings from "@/components/workspace/WorkspaceSettings";
import AIProjectInsights from "@/components/ai/AIProjectInsights";

function CollapsibleSection({ title, icon: Icon, children, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-slate-500" />}
          <span className="font-semibold text-slate-800">{title}</span>
          {badge !== undefined && (
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{badge}</span>
          )}
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [showWorkspaceSettings, setShowWorkspaceSettings] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects', user?.email],
    queryFn: () => base44.entities.Project.list('-created_date'),
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', user?.email],
    queryFn: () => base44.entities.Task.list('-created_date'),
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const { data: budget = [] } = useQuery({
    queryKey: ['budget', user?.email],
    queryFn: () => base44.entities.Budget.list('-date'),
    enabled: !!user?.email,
    staleTime: 15 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces', user?.email],
    queryFn: () => base44.entities.Workspace.list(),
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: (data) => base44.entities.Workspace.update(currentWorkspace.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setShowWorkspaceSettings(false);
    },
  });



  const createProjectMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create({
      ...data,
      owner_email: user?.email,
      team_members: [user?.email]
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowProjectForm(false);
    },
  });

  const myProjects = projects.filter(p =>
    p.owner_email === user?.email || p.team_members?.includes(user?.email)
  );

  const myTasks = tasks.filter(t => {
    const project = myProjects.find(p => p.id === t.project_id);
    return project && (t.assigned_to === user?.email || !t.assigned_to);
  });

  const activeProjects = myProjects.filter(p => p.status !== 'completed').length;
  const completedTasks = myTasks.filter(t => t.status === 'completed').length;
  const overdueTasks = myTasks.filter(t =>
    t.due_date && isPast(new Date(t.due_date + 'T12:00:00')) && !isToday(new Date(t.due_date + 'T12:00:00')) && t.status !== 'completed'
  ).length;
  const upcomingDeadlines = myTasks.filter(t =>
    t.due_date &&
    t.status !== 'completed' &&
    isBefore(new Date(t.due_date + 'T12:00:00'), addDays(new Date(), 7))
  ).length;

  const urgentTasks = myTasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date) - new Date(b.due_date);
    });

  const isAdmin = user?.role === 'admin';

  const generateTrendData = (tasks) => {
    const weeks = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i * 7);
      const weekStart = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const weekEnd = new Date(date.getTime() + 6 * 24 * 60 * 60 * 1000);
      const total = tasks.filter(t => {
        const tDate = new Date(t.created_date);
        return tDate >= date && tDate <= weekEnd;
      }).length;
      const completed = tasks.filter(t => {
        const tDate = new Date(t.created_date);
        return tDate >= date && tDate <= weekEnd && t.status === 'completed';
      }).length;
      weeks.push({ week: weekStart, total, completed });
    }
    return weeks;
  };

  const generatePriorityData = (projects) => {
    const counts = { urgent: 0, high: 0, medium: 0, low: 0 };
    projects.forEach(p => counts[p.priority || 'medium']++);
    return [
      { name: 'Urgent', value: counts.urgent },
      { name: 'High', value: counts.high },
      { name: 'Medium', value: counts.medium },
      { name: 'Low', value: counts.low }
    ];
  };

  const generateWeeklyHeatmap = (tasks) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = new Array(7).fill(0);
    const today = new Date();
    tasks.forEach(t => {
      const tDate = new Date(t.created_date);
      if (tDate.getTime() > today.getTime() - 7 * 24 * 60 * 60 * 1000) {
        counts[tDate.getDay()]++;
      }
    });
    return days.map((name, i) => ({ name, count: counts[i] }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {user?.full_name ? `Hi, ${user.full_name.split(' ')[0]} 👋` : 'Dashboard'}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">Here's what's happening today</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <WorkspaceSelector
              currentWorkspace={currentWorkspace}
              onWorkspaceChange={setCurrentWorkspace}
              user={user}
            />
            {currentWorkspace && isAdmin && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowWorkspaceSettings(true)}>
                <Settings className="w-4 h-4" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowAIInsights(true)}>
              <Brain className="w-4 h-4 mr-1.5" /> AI Insights
            </Button>
            <Button size="sm" onClick={() => setShowProjectForm(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-1.5" /> New Project
            </Button>
          </div>
        </motion.div>

        {/* Stats - always visible */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatsCard title="Active Projects" value={activeProjects} icon={FolderKanban} color="bg-indigo-500" />
          <StatsCard title="Completed Tasks" value={completedTasks} icon={CheckSquare} color="bg-green-500" subtitle={`of ${myTasks.length}`} />
          <StatsCard title="Due This Week" value={upcomingDeadlines} icon={Clock} color="bg-amber-500" />
          <StatsCard title="Overdue" value={overdueTasks} icon={AlertTriangle} color="bg-red-500" />
        </motion.div>

        {/* Quick actions for urgent tasks */}
        {overdueTasks > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700"><span className="font-semibold">{overdueTasks} overdue task{overdueTasks > 1 ? 's' : ''}</span> need your attention</p>
            <Link to={createPageUrl("Projects")} className="ml-auto text-xs font-medium text-red-600 hover:underline whitespace-nowrap">View all →</Link>
          </motion.div>
        )}

        {/* Collapsible sections */}
        <CollapsibleSection title="Upcoming Tasks" icon={Clock} badge={urgentTasks.length} defaultOpen={true}>
          <UpcomingTasks
            tasks={urgentTasks}
            onTaskClick={(task) => {
              const project = myProjects.find(p => p.id === task.project_id);
              if (project) window.location.href = createPageUrl(`ProjectDetail?id=${project.id}`);
            }}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Projects Overview" icon={FolderKanban} badge={myProjects.length} defaultOpen={true}>
          <ProjectsOverview projects={myProjects} tasks={tasks} />
        </CollapsibleSection>

        <CollapsibleSection title="Activity Feed" icon={CheckSquare} defaultOpen={true}>
          <ActivityFeed projects={myProjects} userEmail={user?.email} />
        </CollapsibleSection>

        <CollapsibleSection title="Project Health Monitor" icon={Brain} defaultOpen={false}>
          <ProjectHealthMonitor projects={myProjects} tasks={myTasks} />
        </CollapsibleSection>

        {/* Task Completion Trend */}
        <CollapsibleSection title="Task Completion Trend" icon={CheckSquare} defaultOpen={false}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={generateTrendData(myTasks)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", borderRadius: "8px", color: "#f1f5f9" }} />
              <Legend />
              <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e" }} />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
            </LineChart>
          </ResponsiveContainer>
        </CollapsibleSection>

        {/* Project Priority Distribution */}
        <CollapsibleSection title="Project Priority Distribution" icon={AlertTriangle} defaultOpen={false}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={generatePriorityData(myProjects)} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                <Cell fill="#ef4444" />
                <Cell fill="#f59e0b" />
                <Cell fill="#3b82f6" />
                <Cell fill="#6b7280" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CollapsibleSection>

        {/* Weekly Activity Heatmap */}
        <CollapsibleSection title="Weekly Activity" icon={Clock} defaultOpen={false}>
          <div className="grid grid-cols-7 gap-2">
            {generateWeeklyHeatmap(myTasks).map((day, i) => (
              <div key={i} className="text-center">
                <p className="text-xs font-medium text-slate-600 mb-2">{day.name}</p>
                <div className={`h-12 rounded-lg flex items-center justify-center font-bold text-white transition-colors ${
                  day.count === 0 ? 'bg-slate-200' :
                  day.count <= 2 ? 'bg-green-300' :
                  day.count <= 5 ? 'bg-green-500' :
                  'bg-green-700'
                }`}>
                  {day.count}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>


      </div>

      <ProjectForm
        open={showProjectForm}
        onOpenChange={setShowProjectForm}
        onSubmit={(data) => createProjectMutation.mutate(data)}
        isLoading={createProjectMutation.isPending}
      />

      {currentWorkspace && isAdmin && (
        <WorkspaceSettings
          open={showWorkspaceSettings}
          onOpenChange={setShowWorkspaceSettings}
          workspace={currentWorkspace}
          onUpdate={(data) => updateWorkspaceMutation.mutate(data)}
          user={user}
        />
      )}

      <AIProjectInsights
        open={showAIInsights}
        onOpenChange={setShowAIInsights}
        projects={myProjects}
        tasks={myTasks}
        budget={budget}
        teamMembers={[...new Set(myTasks.map(t => t.assigned_to).filter(Boolean))]}
      />
    </div>
  );
}