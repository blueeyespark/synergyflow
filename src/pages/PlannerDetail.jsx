import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, addDays, addWeeks, addMonths, addYears } from "date-fns";
import {
  Plus, Settings, MessageSquare, Users, ArrowLeft, Lock, 
  Eye, Pencil, RefreshCw, Link2, ChevronRight, Share2, History, Brain, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

import TaskForm from "@/components/tasks/TaskForm";
import PlannerChat from "@/components/planner/PlannerChat";
import CustomStatusManager from "@/components/planner/CustomStatusManager";
import UserPresenceIndicator from "@/components/collaboration/UserPresenceIndicator";
import KanbanBoard from "@/components/planner/KanbanBoard";
import TaskDetailSheet from "@/components/planner/TaskDetailSheet";
import AITaskAssistant from "@/components/ai/AITaskAssistant";
import ShareDialog from "@/components/sharing/ShareDialog";
import ActivityLogPanel from "@/components/activity/ActivityLogPanel";

export default function PlannerDetail() {
  const [user, setUser] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showStatusManager, setShowStatusManager] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [swimlaneBy, setSwimlaneBy] = useState(null); // null | 'priority' | 'assignee'
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const plannerId = urlParams.get('id');

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  // Update presence
  useEffect(() => {
    if (!user?.email || !plannerId) return;
    
    const updatePresence = async () => {
      const existing = await base44.entities.UserPresence.filter({ user_email: user.email });
      const data = {
        user_email: user.email,
        user_name: user.full_name,
        status: 'online',
        current_planner_id: plannerId,
        last_seen: new Date().toISOString()
      };
      if (existing.length > 0) {
        await base44.entities.UserPresence.update(existing[0].id, data);
      } else {
        await base44.entities.UserPresence.create(data);
      }
    };
    
    updatePresence();
    const interval = setInterval(updatePresence, 30000);
    return () => clearInterval(interval);
  }, [user, plannerId]);

  const { data: planner, isLoading: plannerLoading } = useQuery({
    queryKey: ['planner', plannerId],
    queryFn: () => base44.entities.Planner.filter({ id: plannerId }).then(r => r[0]),
    enabled: !!plannerId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['planner-tasks', plannerId],
    queryFn: () => base44.entities.Task.filter({ project_id: plannerId }, '-created_date'),
    enabled: !!plannerId,
  });

  const { data: presences = [] } = useQuery({
    queryKey: ['presences', plannerId],
    queryFn: () => base44.entities.UserPresence.filter({ current_planner_id: plannerId }),
    enabled: !!plannerId,
    refetchInterval: 10000,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['planner-comments', plannerId],
    queryFn: async () => {
      const taskIds = tasks.map(t => t.id);
      if (taskIds.length === 0) return [];
      const allComments = await base44.entities.TaskComment.list('-created_date');
      return allComments.filter(c => taskIds.includes(c.task_id));
    },
    enabled: !!plannerId && tasks.length > 0,
  });

  const { data: chatMessages = [] } = useQuery({
    queryKey: ['chat-messages', plannerId],
    queryFn: () => base44.entities.ChatMessage.filter({ planner_id: plannerId }, '-created_date'),
    enabled: !!plannerId,
  });

  const getTaskCommentCount = (taskId) => comments.filter(c => c.task_id === taskId).length;

  // Determine user role
  const getUserRole = () => {
    if (!planner || !user) return 'viewer';
    if (planner.owner_email === user.email) return 'owner';
    const share = planner.shared_with?.find(s => s.email === user.email);
    return share?.role || 'viewer';
  };
  const userRole = getUserRole();
  const canEdit = userRole === 'owner' || userRole === 'editor';
  const canComment = canEdit || userRole === 'commenter';

  const logActivity = async (action, entityId, entityName, changes = null) => {
    await base44.entities.ActivityLog.create({
      entity_type: 'task',
      entity_id: entityId,
      entity_name: entityName,
      action,
      changes,
      user_email: user?.email,
      user_name: user?.full_name,
      parent_id: plannerId
    });
  };

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create({ ...data, project_id: plannerId }),
    onSuccess: async (newTask, variables) => {
      queryClient.invalidateQueries({ queryKey: ['planner-tasks', plannerId] });
      setShowTaskForm(false);
      setEditingTask(null);
      
      await logActivity('created', newTask.id, variables.title);
      
      // Handle recurring task
      if (variables.recurring?.enabled) {
        createRecurringInstances(newTask, variables.recurring);
      }
      toast.success("Task created");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data, oldData }) => {
      const result = await base44.entities.Task.update(id, data);
      
      // Log changes
      const changes = {};
      Object.keys(data).forEach(key => {
        if (oldData && oldData[key] !== data[key]) {
          changes[key] = { from: oldData[key], to: data[key] };
        }
      });
      
      if (Object.keys(changes).length > 0) {
        await logActivity('updated', id, oldData?.title || 'Task', changes);
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-tasks', plannerId] });
      setEditingTask(null);
      setShowTaskForm(false);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id) => {
      const task = tasks.find(t => t.id === id);
      await base44.entities.Task.delete(id);
      if (task) {
        await logActivity('deleted', id, task.title);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-tasks', plannerId] });
      toast.success("Task deleted");
    },
  });

  const updatePlannerMutation = useMutation({
    mutationFn: (data) => base44.entities.Planner.update(plannerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner', plannerId] });
      toast.success("Planner updated");
    },
  });

  const createRecurringInstances = async (baseTask, recurring) => {
    const { frequency, interval = 1, end_date } = recurring;
    const endDate = end_date ? new Date(end_date) : addMonths(new Date(), 3);
    let currentDate = baseTask.due_date ? new Date(baseTask.due_date) : new Date();
    const instances = [];

    while (currentDate < endDate && instances.length < 52) {
      switch (frequency) {
        case 'daily': currentDate = addDays(currentDate, interval); break;
        case 'weekly': currentDate = addWeeks(currentDate, interval); break;
        case 'biweekly': currentDate = addWeeks(currentDate, 2); break;
        case 'monthly': currentDate = addMonths(currentDate, interval); break;
        case 'yearly': currentDate = addYears(currentDate, interval); break;
      }
      
      if (currentDate < endDate) {
        instances.push({
          ...baseTask,
          due_date: format(currentDate, 'yyyy-MM-dd'),
          parent_task_id: baseTask.id,
          recurring: null
        });
      }
    }

    if (instances.length > 0) {
      await base44.entities.Task.bulkCreate(instances);
      queryClient.invalidateQueries({ queryKey: ['planner-tasks', plannerId] });
    }
  };

  // Group tasks by status
  const statuses = planner?.custom_statuses || [
    { id: 'todo', name: 'To Do', color: '#64748b' },
    { id: 'in_progress', name: 'In Progress', color: '#3b82f6' },
    { id: 'completed', name: 'Completed', color: '#22c55e' }
  ];

  // Check dependencies
  const isTaskBlocked = (task) => {
    if (!task.depends_on?.length) return false;
    return task.depends_on.some(depId => {
      const depTask = tasks.find(t => t.id === depId);
      return depTask && depTask.status !== 'completed';
    });
  };

  const handleTaskMove = async (taskId, newStatus, newIndex) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;
    
    await updateTaskMutation.mutateAsync({ 
      id: taskId, 
      data: { status: newStatus },
      oldData: task
    });
  };

  const handleCreateTasksFromAI = async (aiTasks) => {
    for (const task of aiTasks) {
      await base44.entities.Task.create({
        ...task,
        project_id: plannerId,
        status: 'todo'
      });
    }
    queryClient.invalidateQueries({ queryKey: ['planner-tasks', plannerId] });
  };

  const handleAssignTask = async (taskId, assignTo) => {
    const task = tasks.find(t => t.id === taskId);
    await updateTaskMutation.mutateAsync({
      id: taskId,
      data: { assigned_to: assignTo },
      oldData: task
    });
  };

  // Get team members from shared_with
  const teamMembers = [
    planner?.owner_email,
    ...(planner?.shared_with?.map(s => s.email) || [])
  ].filter(Boolean);

  if (plannerLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  if (!planner) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Planner not found</h2>
          <Link to={createPageUrl("Planner")}>
            <Button>Back to Planners</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link to={createPageUrl("Planner")} className="hover:text-indigo-600 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Planners
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span>{planner.name}</span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: planner.color || '#6366f1' }}
              >
                {planner.name?.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  {planner.name}
                  {planner.is_private && <Lock className="w-4 h-4 text-slate-400" />}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {userRole === 'owner' ? 'Owner' : userRole}
                  </Badge>
                  <UserPresenceIndicator presences={presences} currentUser={user} />
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-white">
                <Button variant={swimlaneBy === null ? 'secondary' : 'ghost'} size="sm" className="h-7 text-xs px-2" onClick={() => setSwimlaneBy(null)}>Board</Button>
                <Button variant={swimlaneBy === 'priority' ? 'secondary' : 'ghost'} size="sm" className="h-7 text-xs px-2" onClick={() => setSwimlaneBy('priority')}>Priority</Button>
                <Button variant={swimlaneBy === 'assignee' ? 'secondary' : 'ghost'} size="sm" className="h-7 text-xs px-2" onClick={() => setSwimlaneBy('assignee')}>Assignee</Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowActivity(true)}>
                <History className="w-4 h-4 mr-2" />
                Activity
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowChat(!showChat)}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowAI(true)}>
                <Brain className="w-4 h-4 mr-2" />
                AI Assistant
              </Button>
              {userRole === 'owner' && (
                <Button variant="outline" size="sm" onClick={() => setShowShare(true)}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              )}
              {canEdit && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setShowStatusManager(true)}>
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button size="sm" onClick={() => { setEditingTask(null); setShowTaskForm(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>

        <div className="flex gap-6">
          {/* Main Content - Kanban Board with Drag & Drop */}
          <div className={`flex-1 ${showChat ? 'pr-80' : ''}`}>
            <KanbanBoard
              statuses={statuses}
              tasks={tasks}
              onTaskMove={handleTaskMove}
              onTaskClick={(task) => setSelectedTask(task)}
              onTaskEdit={(task) => { setEditingTask(task); setShowTaskForm(true); }}
              onTaskDelete={(taskId) => deleteTaskMutation.mutate(taskId)}
              canEdit={canEdit}
              getTaskCommentCount={getTaskCommentCount}
              isTaskBlocked={isTaskBlocked}
              swimlaneBy={swimlaneBy}
            />
          </div>

          {/* Chat Sidebar */}
          {showChat && (
            <div className="fixed right-0 top-16 bottom-0 w-80 bg-white border-l border-slate-200 shadow-lg">
              <PlannerChat 
                plannerId={plannerId} 
                user={user} 
                onClose={() => setShowChat(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Task Form */}
      <TaskForm
        open={showTaskForm}
        onOpenChange={setShowTaskForm}
        task={editingTask}
        tasks={tasks}
        customStatuses={statuses}
        teamMembers={teamMembers}
        onSubmit={(data) => editingTask 
          ? updateTaskMutation.mutate({ id: editingTask.id, data, oldData: editingTask })
          : createTaskMutation.mutate(data)
        }
        isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
      />

      {/* Task Detail Sheet */}
      <TaskDetailSheet
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        task={selectedTask}
        user={user}
        canEdit={canEdit}
        canComment={canComment}
        onEdit={(task) => { setSelectedTask(null); setEditingTask(task); setShowTaskForm(true); }}
        allTasks={tasks}
        statuses={statuses}
      />

      {/* Custom Status Manager */}
      <CustomStatusManager
        open={showStatusManager}
        onOpenChange={setShowStatusManager}
        statuses={planner.custom_statuses || []}
        onSave={(statuses) => updatePlannerMutation.mutate({ custom_statuses: statuses })}
      />

      {/* AI Task Assistant */}
      <AITaskAssistant
        open={showAI}
        onOpenChange={setShowAI}
        tasks={tasks}
        teamMembers={teamMembers}
        comments={comments}
        chatMessages={chatMessages}
        onCreateTasks={handleCreateTasksFromAI}
        onAssignTask={handleAssignTask}
      />

      {/* Share Dialog */}
      <ShareDialog
        open={showShare}
        onOpenChange={setShowShare}
        title={planner?.name}
        entityType="Planner"
        entityId={plannerId}
        ownerEmail={planner?.owner_email}
        sharedWith={planner?.shared_with || []}
        onUpdate={(data) => updatePlannerMutation.mutate(data)}
      />

      {/* Activity Log */}
      <ActivityLogPanel
        open={showActivity}
        onOpenChange={setShowActivity}
        parentId={plannerId}
      />
    </div>
  );
}