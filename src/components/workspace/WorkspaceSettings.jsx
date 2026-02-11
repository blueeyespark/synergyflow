import { useState } from "react";
import { 
  Settings, Users, Shield, Trash2, Plus, Edit2, 
  Check, X, Crown, Eye, MessageSquare, Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const ALL_PERMISSIONS = [
  { id: 'view', name: 'View Content', description: 'View projects, tasks, and data' },
  { id: 'comment', name: 'Add Comments', description: 'Comment on tasks and discussions' },
  { id: 'edit', name: 'Edit Content', description: 'Edit tasks and project details' },
  { id: 'create_tasks', name: 'Create Tasks', description: 'Create new tasks' },
  { id: 'delete_tasks', name: 'Delete Tasks', description: 'Delete tasks' },
  { id: 'manage_projects', name: 'Manage Projects', description: 'Create and delete projects' },
  { id: 'edit_budget', name: 'Edit Budget', description: 'Manage budget entries' },
  { id: 'create_reports', name: 'Create Reports', description: 'Generate and export reports' },
  { id: 'manage_users', name: 'Manage Users', description: 'Invite and remove members' },
  { id: 'manage_roles', name: 'Manage Roles', description: 'Create and edit custom roles' },
  { id: 'all', name: 'Full Access', description: 'All permissions (admin)' }
];

const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#22c55e', '#3b82f6', '#64748b'];

export default function WorkspaceSettings({ open, onOpenChange, workspace, onUpdate, user }) {
  const [formData, setFormData] = useState({
    name: workspace?.name || '',
    color: workspace?.color || '#6366f1',
    custom_roles: workspace?.custom_roles || [],
    members: workspace?.members || []
  });
  const [newRole, setNewRole] = useState({ name: '', color: '#6366f1', permissions: ['view'] });
  const [editingRole, setEditingRole] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');

  const isOwner = workspace?.owner_email === user?.email;

  const handleSave = () => {
    onUpdate(formData);
    toast.success("Workspace updated");
  };

  const addRole = () => {
    if (!newRole.name.trim()) return;
    const id = newRole.name.toLowerCase().replace(/\s+/g, '_');
    setFormData({
      ...formData,
      custom_roles: [...formData.custom_roles, { ...newRole, id }]
    });
    setNewRole({ name: '', color: '#6366f1', permissions: ['view'] });
  };

  const updateRole = (roleId, updates) => {
    setFormData({
      ...formData,
      custom_roles: formData.custom_roles.map(r => r.id === roleId ? { ...r, ...updates } : r)
    });
  };

  const deleteRole = (roleId) => {
    // Don't allow deleting if members have this role
    const hasMembers = formData.members.some(m => m.role_id === roleId);
    if (hasMembers) {
      toast.error("Cannot delete role with assigned members");
      return;
    }
    setFormData({
      ...formData,
      custom_roles: formData.custom_roles.filter(r => r.id !== roleId)
    });
  };

  const inviteMember = () => {
    if (!inviteEmail.trim()) return;
    if (formData.members.some(m => m.email === inviteEmail)) {
      toast.error("User already invited");
      return;
    }
    setFormData({
      ...formData,
      members: [...formData.members, {
        email: inviteEmail.trim(),
        role_id: inviteRole,
        invited_at: new Date().toISOString(),
        invited_by: user?.email
      }]
    });
    setInviteEmail('');
    toast.success(`Invited ${inviteEmail}`);
  };

  const removeMember = (email) => {
    setFormData({
      ...formData,
      members: formData.members.filter(m => m.email !== email)
    });
  };

  const updateMemberRole = (email, roleId) => {
    setFormData({
      ...formData,
      members: formData.members.map(m => m.email === email ? { ...m, role_id: roleId } : m)
    });
  };

  const togglePermission = (roleId, permissionId) => {
    const role = formData.custom_roles.find(r => r.id === roleId);
    if (!role) return;
    
    const hasPermission = role.permissions.includes(permissionId);
    const newPermissions = hasPermission
      ? role.permissions.filter(p => p !== permissionId)
      : [...role.permissions, permissionId];
    
    updateRole(roleId, { permissions: newPermissions });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Workspace Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
            <TabsTrigger value="roles" className="flex-1">Roles & Permissions</TabsTrigger>
            <TabsTrigger value="members" className="flex-1">Members</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div>
              <Label>Workspace Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isOwner}
              />
            </div>
            <div>
              <Label className="mb-2 block">Color</Label>
              <div className="flex gap-2">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => isOwner && setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-lg transition-all ${formData.color === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : ''} ${!isOwner ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{ backgroundColor: color }}
                    disabled={!isOwner}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="roles" className="space-y-4 mt-4">
            {/* Existing Roles */}
            <div className="space-y-3">
              {formData.custom_roles.map(role => (
                <div key={role.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: role.color }} />
                      <span className="font-medium">{role.name}</span>
                      {role.permissions.includes('all') && (
                        <Badge className="bg-red-100 text-red-700">Admin</Badge>
                      )}
                    </div>
                    {isOwner && role.id !== 'admin' && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteRole(role.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Permissions Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_PERMISSIONS.filter(p => p.id !== 'all').map(permission => (
                      <div 
                        key={permission.id} 
                        className={`flex items-center gap-2 p-2 rounded ${role.permissions.includes('all') ? 'bg-green-50' : 'bg-slate-50'}`}
                      >
                        <Checkbox
                          checked={role.permissions.includes(permission.id) || role.permissions.includes('all')}
                          onCheckedChange={() => isOwner && !role.permissions.includes('all') && togglePermission(role.id, permission.id)}
                          disabled={!isOwner || role.permissions.includes('all')}
                        />
                        <div>
                          <p className="text-sm font-medium">{permission.name}</p>
                          <p className="text-xs text-slate-500">{permission.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Role */}
            {isOwner && (
              <div className="border-2 border-dashed rounded-lg p-4">
                <h4 className="font-medium mb-3">Create New Role</h4>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    placeholder="Role name"
                    className="flex-1"
                  />
                  <div className="flex gap-1">
                    {colors.slice(0, 4).map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewRole({ ...newRole, color })}
                        className={`w-8 h-8 rounded ${newRole.color === color ? 'ring-2 ring-offset-1 ring-indigo-500' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <Button onClick={addRole}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-4 mt-4">
            {/* Invite */}
            {isOwner && (
              <div className="flex gap-2">
                <Input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="flex-1"
                />
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.custom_roles.map(role => (
                      <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={inviteMember}>Invite</Button>
              </div>
            )}

            {/* Owner */}
            <div className="p-3 bg-amber-50 rounded-lg flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-medium">
                {workspace?.owner_email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-medium">{workspace?.owner_email}</p>
                <Badge className="bg-amber-100 text-amber-700">
                  <Crown className="w-3 h-3 mr-1" /> Owner
                </Badge>
              </div>
            </div>

            {/* Members List */}
            <div className="space-y-2">
              {formData.members.map(member => {
                const role = formData.custom_roles.find(r => r.id === member.role_id);
                return (
                  <div key={member.email} className="p-3 bg-slate-50 rounded-lg flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium">
                      {member.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{member.email}</p>
                      <Badge style={{ backgroundColor: role?.color + '20', color: role?.color }}>
                        {role?.name || 'Member'}
                      </Badge>
                    </div>
                    {isOwner && (
                      <div className="flex items-center gap-2">
                        <Select value={member.role_id} onValueChange={(v) => updateMemberRole(member.email, v)}>
                          <SelectTrigger className="w-28 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {formData.custom_roles.map(role => (
                              <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeMember(member.email)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
              {formData.members.length === 0 && (
                <p className="text-center text-slate-400 py-4">No members yet</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}