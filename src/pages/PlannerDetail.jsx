import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, addDays, addWeeks, addMonths, addYears } from "date-fns";
import {
  Plus, Settings, MessageSquare, Users, ArrowLeft, Lock, 
  Eye, Pencil, RefreshCw, Link2, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

import TaskCard from "@/components/tasks/TaskCard";
import TaskForm from "@/components/tasks/TaskForm";
import PlannerChat from "@/components/planner/PlannerChat";
import TaskComments from "@/components/planner/TaskComments";
import CustomStatusManager from "@/components/planner/CustomStatusManager";
import UserPresenceIndicator from "@/components/collaboration/UserPresenceIndicator";

export default function PlannerDetail() {
  const [user, setUser] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showStatusManager, setShowStatusManager] = useState(false);
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

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create({ ...data, project_id: plannerId }),
    onSuccess: (newTask, variables) => {
      queryClient.invalidateQueries({ queryKey: ['planner-tasks', plannerId] });
      setShowTaskForm(false);
      setEditingTask(null);
      
      // Handle recurring task
      if (variables.recurring?.enabled) {
        createRecurringInstances(newTask, variables.recurring);
      }
      toast.success("Task created");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner-tasks', plannerId] });
      setEditingTask(null);
      setShowTaskForm(false);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
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

  const tasksByStatus = statuses.reduce((acc, status) => {
    acc[status.id] = tasks.filter(t => (t.status || 'todo') === status.id);
    return acc;
  }, {});

  // Check dependencies
  const isTaskBlocked = (task) => {
    if (!task.depends_on?.length) return false;
    return task.depends_on.some(depId => {
      const depTask = tasks.find(t => t.id === depId);
      return depTask && depTask.status !== 'completed';
    });
  };

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
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowChat(!showChat)}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat
              </Button>
              {canEdit && (
                <>
                  <Button variant="outline" onClick={() => setShowStatusManager(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Statuses
                  </Button>
                  <Button onClick={() => { setEditingTask(null); setShowTaskForm(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>

        <div className="flex gap-6">
          {/* Main Content - Kanban Board */}
          <div className={`flex-1 ${showChat ? 'pr-80' : ''}`}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {statuses.map(status => (
                <div key={status.id} className="flex-shrink-0 w-80">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                      <h3 className="font-semibold text-slate-900">{status.name}</h3>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {tasksByStatus[status.id]?.length || 0}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {tasksByStatus[status.id]?.map(task => (
                      <div key={task.id} className="relative">
                        {task.recurring?.enabled && (
                          <div className="absolute -top-1 -right-1 z-10">
                            <RefreshCw className="w-3 h-3 text-indigo-500" />
                          </div>
                        )}
                        {isTaskBlocked(task) && (
                          <div className="absolute -top-1 -left-1 z-10">
                            <Link2 className="w-3 h-3 text-amber-500" />
                          </div>
                        )}
                        <TaskCard
                          task={task}
                          onEdit={canEdit ? () => { setEditingTask(task); setShowTaskForm(true); } : undefined}
                          onDelete={canEdit ? () => deleteTaskMutation.mutate(task.id) : undefined}
                          onStatusChange={canEdit ? (status) => updateTaskMutation.mutate({ id: task.id, data: { status } }) : undefined}
                          onClick={() => setSelectedTask(task)}
                          isBlocked={isTaskBlocked(task)}
                        />
                      </div>
                    ))}
                    {tasksByStatus[status.id]?.length === 0 && (
                      <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center text-sm text-slate-400">
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
        onSubmit={(data) => editingTask 
          ? updateTaskMutation.mutate({ id: editingTask.id, data })
          : createTaskMutation.mutate(data)
        }
        isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
      />

      {/* Task Comments Modal */}
      {selectedTask && canComment && (
        <TaskComments
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          task={selectedTask}
          user={user}
          canComment={canComment}
        />
      )}

      {/* Custom Status Manager */}
      <CustomStatusManager
        open={showStatusManager}
        onOpenChange={setShowStatusManager}
        statuses={planner.custom_statuses || []}
        onSave={(statuses) => updatePlannerMutation.mutate({ custom_statuses: statuses })}
      />
    </div>
  );
}