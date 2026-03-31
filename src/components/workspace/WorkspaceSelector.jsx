import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Building2, ChevronDown, Plus, Settings, Users, Check, 
  User, Briefcase, Crown, UserPlus
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, CheckCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

function InviteDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleInvite = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    setLoading(true);
    await base44.users.inviteUser(email.trim(), "user");
    setLoading(false);
    setSent(true);
    toast.success(`Invite sent to ${email.trim()}`);
    setTimeout(() => {
      setOpen(false);
      setEmail("");
      setSent(false);
    }, 1500);
  };

  return (
    <>
      <DropdownMenuItem onClick={() => setOpen(true)} className="flex items-center gap-2">
        <UserPlus className="w-4 h-4" />
        Invite
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite Someone</DialogTitle>
          </DialogHeader>
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
              <p className="text-sm text-slate-600">Invite sent!</p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <Input
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleInvite()}
                autoFocus
              />
              <Button
                className="w-full gap-2"
                onClick={handleInvite}
                disabled={loading || !email.trim()}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Invite
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function WorkspaceSelector({ currentWorkspace, onWorkspaceChange, user }) {
  const queryClient = useQueryClient();

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces', user?.email],
    queryFn: () => base44.entities.Workspace.list(),
    enabled: !!user?.email,
  });

  // Filter workspaces: owned by user or user is a member
  const myWorkspaces = workspaces.filter(w => w.owner_email === user?.email);
  const sharedWorkspaces = workspaces.filter(w => 
    w.owner_email !== user?.email && 
    w.members?.some(m => m.email === user?.email)
  );

  const personalWorkspace = myWorkspaces.find(w => w.is_personal);

  // Create personal workspace if it doesn't exist
  const createPersonalMutation = useMutation({
    mutationFn: () => base44.entities.Workspace.create({
      name: "My Workspace",
      owner_email: user?.email,
      is_personal: true,
      color: "#6366f1",
      custom_roles: [
        { id: 'admin', name: 'Admin', color: '#ef4444', permissions: ['all'] },
        { id: 'editor', name: 'Editor', color: '#22c55e', permissions: ['view', 'edit', 'comment', 'create_tasks', 'delete_tasks', 'manage_projects'] },
        { id: 'commenter', name: 'Commenter', color: '#3b82f6', permissions: ['view', 'comment'] },
        { id: 'viewer', name: 'Viewer', color: '#64748b', permissions: ['view'] }
      ]
    }),
    onSuccess: (newWorkspace) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      onWorkspaceChange(newWorkspace);
    },
  });

  useEffect(() => {
    if (user?.email && workspaces.length > 0 && !currentWorkspace) {
      const personal = workspaces.find(w => w.is_personal && w.owner_email === user.email);
      if (personal) {
        onWorkspaceChange(personal);
      }
    }
  }, [workspaces, user, currentWorkspace]);

  useEffect(() => {
    if (user?.email && workspaces.length === 0) {
      // No workspaces exist, create personal one
      createPersonalMutation.mutate();
    } else if (user?.email && !personalWorkspace) {
      // User has no personal workspace
      createPersonalMutation.mutate();
    }
  }, [user, workspaces, personalWorkspace]);

  const getUserRole = (workspace) => {
    if (workspace.owner_email === user?.email) return 'Owner';
    const member = workspace.members?.find(m => m.email === user?.email);
    if (!member) return 'Guest';
    const role = workspace.custom_roles?.find(r => r.id === member.role_id);
    return role?.name || 'Member';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2">
          <div 
            className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: currentWorkspace?.color || '#6366f1' }}
          >
            {currentWorkspace?.is_personal ? (
              <User className="w-3 h-3" />
            ) : (
              currentWorkspace?.name?.charAt(0) || 'W'
            )}
          </div>
          <span className="hidden sm:inline text-sm font-medium truncate max-w-[120px]">
            {currentWorkspace?.name || 'Select Workspace'}
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {/* Personal Workspace */}
        {personalWorkspace && (
          <>
            <div className="px-2 py-1.5 text-xs font-medium text-slate-500">Personal</div>
            <DropdownMenuItem 
              onClick={() => onWorkspaceChange(personalWorkspace)}
              className="flex items-center gap-2"
            >
              <div 
                className="w-6 h-6 rounded-md flex items-center justify-center text-white"
                style={{ backgroundColor: personalWorkspace.color }}
              >
                <User className="w-3 h-3" />
              </div>
              <span className="flex-1">{personalWorkspace.name}</span>
              {currentWorkspace?.id === personalWorkspace.id && (
                <Check className="w-4 h-4 text-green-500" />
              )}
            </DropdownMenuItem>
            <InviteDialog />
          </>
        )}

        {/* My Workspaces */}
        {myWorkspaces.filter(w => !w.is_personal).length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-medium text-slate-500">My Workspaces</div>
            {myWorkspaces.filter(w => !w.is_personal).map(ws => (
              <DropdownMenuItem 
                key={ws.id}
                onClick={() => onWorkspaceChange(ws)}
                className="flex items-center gap-2"
              >
                <div 
                  className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: ws.color || '#6366f1' }}
                >
                  {ws.name?.charAt(0)}
                </div>
                <span className="flex-1 truncate">{ws.name}</span>
                <Badge variant="secondary" className="text-xs">
                  <Crown className="w-3 h-3 mr-1" />Owner
                </Badge>
                {currentWorkspace?.id === ws.id && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}

        {/* Shared Workspaces */}
        {sharedWorkspaces.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-medium text-slate-500">Shared with me</div>
            {sharedWorkspaces.map(ws => (
              <DropdownMenuItem 
                key={ws.id}
                onClick={() => onWorkspaceChange(ws)}
                className="flex items-center gap-2"
              >
                <div 
                  className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: ws.color || '#6366f1' }}
                >
                  {ws.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm">{ws.name}</p>
                  <p className="text-xs text-slate-400">{getUserRole(ws)}</p>
                </div>
                {currentWorkspace?.id === ws.id && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}