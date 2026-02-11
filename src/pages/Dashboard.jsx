import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, FolderKanban, CheckSquare, Clock, AlertTriangle, Brain, Settings } from "lucide-react";
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
  });

  const { data: planners = [] } = useQuery({
    queryKey: ['planners'],
    queryFn: () => base44.entities.Planner.list('-created_date'),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date'),
  });

  const { data: budget = [] } = useQuery({
    queryKey: ['budget'],
    queryFn: () => base44.entities.Budget.list('-date'),
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

  // Filter projects user has access to
  const myProjects = projects.filter(p => 
    p.owner_email === user?.email || p.team_members?.includes(user?.email)
  );

  // Filter tasks for user
  const myTasks = tasks.filter(t => {
    const project = myProjects.find(p => p.id === t.project_id);
    return project && (t.assigned_to === user?.email || !t.assigned_to);
  });

  // Calculate stats
  const activeProjects = myProjects.filter(p => p.status !== 'completed').length;
  const completedTasks = myTasks.filter(t => t.status === 'completed').length;
  const overdueTasks = myTasks.filter(t => 
    t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && t.status !== 'completed'
  ).length;
  const upcomingDeadlines = myTasks.filter(t => 
    t.due_date && 
    t.status !== 'completed' &&
    isBefore(new Date(t.due_date), addDays(new Date(), 7))
  ).length;

  // Tasks needing attention
  const urgentTasks = myTasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date) - new Date(b.due_date);
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Workspace Selector */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-6"
        >
          <WorkspaceSelector 
            currentWorkspace={currentWorkspace}
            onWorkspaceChange={setCurrentWorkspace}
            user={user}
          />
          {currentWorkspace && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setShowWorkspaceSettings(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-slate-500 mt-1">Here's what's happening with your projects</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAIInsights(true)}>
              <Brain className="w-4 h-4 mr-2" />
              AI Insights
            </Button>
            <Button onClick={() => setShowProjectForm(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Active Projects"
            value={activeProjects}
            icon={FolderKanban}
            color="bg-indigo-500"
          />
          <StatsCard
            title="Completed Tasks"
            value={completedTasks}
            icon={CheckSquare}
            color="bg-green-500"
            subtitle={`of ${myTasks.length} total`}
          />
          <StatsCard
            title="Upcoming Deadlines"
            value={upcomingDeadlines}
            icon={Clock}
            color="bg-amber-500"
            subtitle="within 7 days"
          />
          <StatsCard
            title="Overdue"
            value={overdueTasks}
            icon={AlertTriangle}
            color="bg-red-500"
          />
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          <UpcomingTasks 
            tasks={urgentTasks}
            onTaskClick={(task) => {
              const project = myProjects.find(p => p.id === task.project_id);
              if (project) {
                window.location.href = createPageUrl(`ProjectDetail?id=${project.id}`);
              }
            }}
          />
          <ProjectsOverview projects={myProjects} tasks={tasks} />
        </div>
      </div>

      <ProjectForm
        open={showProjectForm}
        onOpenChange={setShowProjectForm}
        onSubmit={(data) => createProjectMutation.mutate(data)}
        isLoading={createProjectMutation.isPending}
      />

      {currentWorkspace && (
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