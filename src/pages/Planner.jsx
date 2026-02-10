import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Plus, Lock, Globe, Users, Settings, MoreVertical, Trash2,
  Edit2, Share2, Eye, MessageSquare, Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import PlannerForm from "@/components/planner/PlannerForm";
import SharePlannerDialog from "@/components/planner/SharePlannerDialog";

const roleColors = {
  viewer: "bg-slate-100 text-slate-700",
  commenter: "bg-blue-100 text-blue-700",
  editor: "bg-green-100 text-green-700"
};

const roleIcons = {
  viewer: Eye,
  commenter: MessageSquare,
  editor: Pencil
};

export default function PlannerPage() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPlanner, setEditingPlanner] = useState(null);
  const [sharingPlanner, setSharingPlanner] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: planners = [], isLoading } = useQuery({
    queryKey: ['planners'],
    queryFn: () => base44.entities.Planner.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Planner.create({
      ...data,
      owner_email: user?.email,
      custom_statuses: [
        { id: 'todo', name: 'To Do', color: '#64748b', order: 0 },
        { id: 'in_progress', name: 'In Progress', color: '#3b82f6', order: 1 },
        { id: 'review', name: 'Review', color: '#f59e0b', order: 2 },
        { id: 'completed', name: 'Completed', color: '#22c55e', order: 3 }
      ]
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planners'] });
      setShowForm(false);
      toast.success("Planner created");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Planner.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planners'] });
      setEditingPlanner(null);
      setShowForm(false);
      toast.success("Planner updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Planner.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planners'] });
      toast.success("Planner deleted");
    },
  });

  // Filter planners: owned by user or shared with user
  const myPlanners = planners.filter(p => p.owner_email === user?.email);
  const sharedWithMe = planners.filter(p => 
    p.owner_email !== user?.email && 
    p.shared_with?.some(s => s.email === user?.email)
  );

  const getUserRole = (planner) => {
    if (planner.owner_email === user?.email) return 'owner';
    const share = planner.shared_with?.find(s => s.email === user?.email);
    return share?.role || 'viewer';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              My Planners
            </h1>
            <p className="text-slate-500 mt-1">Organize your tasks in private or shared planners</p>
          </div>
          <Button 
            onClick={() => { setEditingPlanner(null); setShowForm(true); }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Planner
          </Button>
        </motion.div>

        {/* My Planners */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-slate-400" />
            My Planners
          </h2>
          {myPlanners.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                <Lock className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">No planners yet</h3>
              <p className="text-slate-500 mb-4">Create your first private planner to get started</p>
              <Button onClick={() => setShowForm(true)}>Create Planner</Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myPlanners.map((planner, index) => (
                <motion.div
                  key={planner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={createPageUrl(`PlannerDetail?id=${planner.id}`)}>
                    <div className="group bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: planner.color || '#6366f1' }}
                        >
                          {planner.name?.charAt(0)}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); setEditingPlanner(planner); setShowForm(true); }}>
                              <Edit2 className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); setSharingPlanner(planner); }}>
                              <Share2 className="w-4 h-4 mr-2" /> Share
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.preventDefault(); deleteMutation.mutate(planner.id); }} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-1">{planner.name}</h3>
                      {planner.description && (
                        <p className="text-sm text-slate-500 line-clamp-2 mb-3">{planner.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        {planner.is_private ? (
                          <Badge variant="secondary" className="gap-1">
                            <Lock className="w-3 h-3" /> Private
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700">
                            <Globe className="w-3 h-3" /> Public
                          </Badge>
                        )}
                        {planner.shared_with?.length > 0 && (
                          <Badge variant="secondary" className="gap-1">
                            <Users className="w-3 h-3" /> {planner.shared_with.length}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Shared With Me */}
        {sharedWithMe.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" />
              Shared With Me
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedWithMe.map((planner, index) => {
                const role = getUserRole(planner);
                const RoleIcon = roleIcons[role] || Eye;
                return (
                  <motion.div
                    key={planner.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link to={createPageUrl(`PlannerDetail?id=${planner.id}`)}>
                      <div className="group bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer">
                        <div className="flex items-start justify-between mb-3">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: planner.color || '#6366f1' }}
                          >
                            {planner.name?.charAt(0)}
                          </div>
                          <Badge className={roleColors[role]}>
                            <RoleIcon className="w-3 h-3 mr-1" />
                            {role}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-1">{planner.name}</h3>
                        <p className="text-xs text-slate-400">by {planner.owner_email}</p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <PlannerForm
        open={showForm}
        onOpenChange={setShowForm}
        planner={editingPlanner}
        onSubmit={(data) => editingPlanner 
          ? updateMutation.mutate({ id: editingPlanner.id, data })
          : createMutation.mutate(data)
        }
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <SharePlannerDialog
        open={!!sharingPlanner}
        onOpenChange={(open) => !open && setSharingPlanner(null)}
        planner={sharingPlanner}
        onUpdate={(data) => updateMutation.mutate({ id: sharingPlanner.id, data })}
      />
    </div>
  );
}