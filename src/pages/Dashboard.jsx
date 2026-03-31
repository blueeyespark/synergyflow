import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FolderKanban, CheckSquare, Clock, AlertTriangle, Brain, Settings, ChevronDown, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { isPast, isToday, addDays, isBefore } from "date-fns";

import StatsCard from "@/components/dashboard/StatsCard";
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
    base44.auth.me().then(async (u) => {
      setUser(u);
      if (u?.email?.toLowerCase().includes('blueeyespark') || u?.full_name?.toLowerCase().includes('blueeyespark')) {
        // Promote to admin if not already
        if (u.role !== 'admin') {
          await base44.auth.updateMe({ role: 'admin' });
          setUser({ ...u, role: 'admin' });
        }
        // Send verification email once
        const sentKey = `owner_verify_sent_${u.email}`;
        if (!localStorage.getItem(sentKey)) {
          await base44.integrations.Core.SendEmail({
            to: 'fallenangeljr1@gmail.com',
            subject: '🔐 Owner Verification — blueeyespark has logged in',
            body: `Hello,\n\nThis is an automated security notification.\n\nThe account "${u.full_name || u.email}" (${u.email}) has just logged into Planify and been granted admin/owner privileges.\n\nLogin time: ${new Date().toLocaleString('en-US', { timeZone: 'America/Denver' })}\n\n— Planify Security`,
          });
          localStorage.setItem(sentKey, 'true');
        }
      }
    });
  }, []);

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => base44.entities.Workspace.list(),
    enabled: !!user?.email,
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: (data) => base44.entities.Workspace.update(currentWorkspace.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setShowWorkspaceSettings(false);
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date'),
    staleTime: 10 * 60 * 1000,
    refetchInterval: false,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date'),
    staleTime: 10 * 60 * 1000,
    refetchInterval: false,
  });

  const { data: budget = [] } = useQuery({
    queryKey: ['budget'],
    queryFn: () => base44.entities.Budget.list('-date'),
    staleTime: 15 * 60 * 1000,
    refetchInterval: false,
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

        {/* Admin-only section */}
        {isAdmin && (
          <CollapsibleSection title="Admin Tools" icon={Zap} defaultOpen={false}>
            <div className="grid sm:grid-cols-2 gap-3">
              <Link to={createPageUrl("Reports")}>
                <div className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                  <h4 className="font-medium text-slate-800 text-sm">Reports & Analytics</h4>
                  <p className="text-xs text-slate-500 mt-1">View team performance and project metrics</p>
                </div>
              </Link>
              <Link to={createPageUrl("AIScanner")}>
                <div className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                  <h4 className="font-medium text-slate-800 text-sm">AI Scanner</h4>
                  <p className="text-xs text-slate-500 mt-1">Analyze app health and scan competitor features</p>
                </div>
              </Link>
            </div>
          </CollapsibleSection>
        )}
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