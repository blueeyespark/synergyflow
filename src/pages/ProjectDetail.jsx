import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, isAfter, isBefore, parseISO, subDays } from "date-fns";
import {
  ArrowLeft, Plus, Calendar, Users, Settings,
  CheckSquare, Circle, ArrowRight, Eye, UserPlus,
  BarChart3, List
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

import TaskCard from "@/components/tasks/TaskCard";
import TaskForm from "@/components/tasks/TaskForm";
import TaskFilters from "@/components/tasks/TaskFilters";
import ProjectForm from "@/components/projects/ProjectForm";
import InviteTeamDialog from "@/components/team/InviteTeamDialog";
import GanttChart from "@/components/gantt/GanttChart";
import ReminderChecker from "@/components/reminders/ReminderChecker";

export default function ProjectDetail() {
  const [user, setUser] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');
  
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTask, setDeleteTask] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState("list"); // "list" or "gantt"
  const [filters, setFilters] = useState({
    assignee: "",
    priority: "",
    dueDateFrom: "",
    dueDateTo: ""
  });
  const [sortBy, setSortBy] = useState("created_date");
  const [sortOrder, setSortOrder] = useState("desc");
  
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => base44.entities.Project.filter({ id: projectId }).then(res => res[0]),
    enabled: !!projectId,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => base44.entities.Task.filter({ project_id: projectId }, '-created_date'),
    enabled: !!projectId,
  });

  const updateProjectMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.update(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowProjectForm(false);
      toast.success("Project updated");
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data) => {
      const task = await base44.entities.Task.create(data);
      
      // Create notification if assigned to someone else
      if (data.assigned_to && data.assigned_to !== user?.email) {
        await base44.entities.Notification.create({
          user_email: data.assigned_to,
          type: "task_assigned",
          title: "New task assigned to you",
          message: `"${data.title}" in project "${project?.name}"`,
          project_id: projectId,
          task_id: task.id
        });
      }
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      setShowTaskForm(false);
      toast.success("Task created");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const task = await base44.entities.Task.update(id, data);
      
      // Create notification on status change to completed
      if (data.status === 'completed' && project?.owner_email && project.owner_email !== user?.email) {
        await base44.entities.Notification.create({
          user_email: project.owner_email,
          type: "task_completed",
          title: "Task completed",
          message: `"${editingTask?.title || 'A task'}" was marked as completed in "${project?.name}"`,
          project_id: projectId,
          task_id: id
        });
      }
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      setShowTaskForm(false);
      setEditingTask(null);
      toast.success("Task updated");
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      setDeleteTask(null);
      toast.success("Task deleted");
    },
  });

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900">Project not found</h2>
          <Link to={createPageUrl("Projects")} className="text-indigo-600 mt-2 inline-block">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Apply filters and sorting
  const filteredTasks = tasks.filter(task => {
    // Status filter (tabs)
    if (activeTab !== "all" && task.status !== activeTab) return false;
    
    // Assignee filter
    if (filters.assignee) {
      if (filters.assignee === "unassigned" && task.assigned_to) return false;
      if (filters.assignee !== "unassigned" && task.assigned_to !== filters.assignee) return false;
    }
    
    // Priority filter
    if (filters.priority && task.priority !== filters.priority) return false;
    
    // Due date range filter
    if (filters.dueDateFrom && task.due_date) {
      if (isBefore(parseISO(task.due_date), parseISO(filters.dueDateFrom))) return false;
    }
    if (filters.dueDateTo && task.due_date) {
      if (isAfter(parseISO(task.due_date), parseISO(filters.dueDateTo))) return false;
    }
    
    return true;
  }).sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    const statusOrder = { todo: 1, in_progress: 2, review: 3, completed: 4 };
    
    let comparison = 0;
    switch (sortBy) {
      case "due_date":
        if (!a.due_date && !b.due_date) comparison = 0;
        else if (!a.due_date) comparison = 1;
        else if (!b.due_date) comparison = -1;
        else comparison = new Date(a.due_date) - new Date(b.due_date);
        break;
      case "priority":
        comparison = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        break;
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      case "status":
        comparison = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
        break;
      default: // created_date
        comparison = new Date(b.created_date) - new Date(a.created_date);
    }
    
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const handleTaskSubmit = (data) => {
    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, data });
    } else {
      createTaskMutation.mutate(data);
    }
  };

  const getTaskDependencyStatus = (task) => {
    if (!task.depends_on || task.depends_on.length === 0) {
      return { isBlocked: false, blockingTasks: [] };
    }
    
    const blockingTasks = task.depends_on
      .map(depId => tasks.find(t => t.id === depId))
      .filter(t => t && t.status !== 'completed');
    
    return {
      isBlocked: blockingTasks.length > 0 && task.status !== 'completed',
      blockingTasks
    };
  };

  const handleStatusChange = (task, newStatus) => {
    const { isBlocked } = getTaskDependencyStatus(task);
    
    if (isBlocked && newStatus !== 'completed' && newStatus !== task.status) {
      toast.error("This task is blocked by incomplete dependencies");
      return;
    }
    
    updateTaskMutation.mutate({
      id: task.id,
      data: { 
        ...task, 
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      }
    });
  };

  const handleGanttUpdate = (taskId, updates) => {
    updateTaskMutation.mutate({ id: taskId, data: updates });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link 
            to={createPageUrl("Projects")}
            className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Projects
          </Link>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div 
              className="h-2"
              style={{ backgroundColor: project.color || '#6366f1' }}
            />
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
                  {project.description && (
                    <p className="text-slate-500 mt-2">{project.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-500">
                    {project.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Due {format(new Date(project.due_date), "MMM d, yyyy")}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {project.team_members?.length || 1} members
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInviteDialog(true)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProjectForm(true)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600 font-medium">Progress</span>
                  <span className="text-slate-500">{completedTasks}/{tasks.length} tasks completed</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* View Toggle & Tasks Section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-200">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="gap-2"
            >
              <List className="w-4 h-4" />
              List
            </Button>
            <Button
              variant={viewMode === "gantt" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("gantt")}
              className="gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Gantt
            </Button>
          </div>
          <Button onClick={() => setShowTaskForm(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        {viewMode === "gantt" ? (
          <GanttChart tasks={tasks} onTaskUpdate={handleGanttUpdate} />
        ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all" className="gap-1">
                    All
                    <span className="text-xs bg-slate-100 px-1.5 rounded">{tasks.length}</span>
                  </TabsTrigger>
                  <TabsTrigger value="todo" className="gap-1">
                    <Circle className="w-3 h-3" />
                    To Do
                  </TabsTrigger>
                  <TabsTrigger value="in_progress" className="gap-1">
                    <ArrowRight className="w-3 h-3" />
                    In Progress
                  </TabsTrigger>
                  <TabsTrigger value="review" className="gap-1">
                    <Eye className="w-3 h-3" />
                    Review
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="gap-1">
                    <CheckSquare className="w-3 h-3" />
                    Done
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <TaskFilters
              filters={filters}
              onFiltersChange={setFilters}
              teamMembers={project.team_members}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={(field, order) => {
                setSortBy(field);
                setSortOrder(order);
              }}
            />
          </div>

          <div className="p-4">
            {tasksLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse bg-slate-100 h-20 rounded-xl" />
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-medium text-slate-900">No tasks yet</h3>
                <p className="text-sm text-slate-500 mt-1">Create your first task to get started</p>
                <Button onClick={() => setShowTaskForm(true)} className="mt-4" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredTasks.map((task, index) => {
                    const { isBlocked, blockingTasks } = getTaskDependencyStatus(task);
                    return (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={index}
                        allTasks={tasks}
                        isBlocked={isBlocked}
                        blockingTasks={blockingTasks}
                        onEdit={(t) => {
                          setEditingTask(t);
                          setShowTaskForm(true);
                        }}
                        onDelete={setDeleteTask}
                        onStatusChange={handleStatusChange}
                      />
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      <TaskForm
        open={showTaskForm}
        onOpenChange={(open) => {
          setShowTaskForm(open);
          if (!open) setEditingTask(null);
        }}
        task={editingTask}
        projectId={projectId}
        teamMembers={project.team_members}
        allTasks={tasks}
        onSubmit={handleTaskSubmit}
        isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
      />

      <ProjectForm
        open={showProjectForm}
        onOpenChange={setShowProjectForm}
        project={project}
        onSubmit={(data) => updateProjectMutation.mutate(data)}
        isLoading={updateProjectMutation.isPending}
      />

      <InviteTeamDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        project={project}
        onInvited={() => {
          queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        }}
      />

      <ReminderChecker tasks={tasks} projectName={project?.name} user={user} />

      <AlertDialog open={!!deleteTask} onOpenChange={() => setDeleteTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTask?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTaskMutation.mutate(deleteTask.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}