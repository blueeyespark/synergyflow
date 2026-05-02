import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, Shield, Crown, Eye, Edit3, Trash2, Mail, Check, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ROLES = [
  {
    id: "admin",
    label: "Admin",
    icon: Crown,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10 border-yellow-400/30",
    description: "Full control — manage channel, upload, delete, manage team",
    permissions: ["upload_videos", "delete_videos", "edit_channel", "manage_team", "view_analytics", "manage_comments", "manage_financials"],
  },
  {
    id: "moderator",
    label: "Moderator",
    icon: Shield,
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/30",
    description: "Can moderate comments, manage uploads, view analytics",
    permissions: ["upload_videos", "manage_comments", "view_analytics"],
  },
  {
    id: "editor",
    label: "Editor",
    icon: Edit3,
    color: "text-green-400",
    bg: "bg-green-400/10 border-green-400/30",
    description: "Can upload and edit videos only",
    permissions: ["upload_videos"],
  },
  {
    id: "viewer",
    label: "Viewer",
    icon: Eye,
    color: "text-slate-400",
    bg: "bg-slate-400/10 border-slate-400/30",
    description: "Read-only access to analytics and content",
    permissions: ["view_analytics"],
  },
];

const ALL_PERMISSIONS = [
  { id: "upload_videos", label: "Upload & Edit Videos" },
  { id: "delete_videos", label: "Delete Videos" },
  { id: "edit_channel", label: "Edit Channel Settings" },
  { id: "manage_team", label: "Manage Team Members" },
  { id: "view_analytics", label: "View Analytics" },
  { id: "manage_comments", label: "Manage Comments" },
  { id: "manage_financials", label: "View Financials" },
];

function RoleBadge({ roleId }) {
  const role = ROLES.find(r => r.id === roleId) || ROLES[1];
  const Icon = role.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${role.bg} ${role.color}`}>
      <Icon className="w-3 h-3" /> {role.label}
    </span>
  );
}

export default function TeamManagement() {
  const [user, setUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("moderator");
  const [customPermissions, setCustomPermissions] = useState([]);
  const [useCustom, setUseCustom] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      // Load team from localStorage keyed by user
      const saved = localStorage.getItem(`vstream_team_${u?.email}`);
      if (saved) setTeamMembers(JSON.parse(saved));
    });
  }, []);

  const saveTeam = (members) => {
    setTeamMembers(members);
    if (user?.email) localStorage.setItem(`vstream_team_${user.email}`, JSON.stringify(members));
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { toast.error("Enter an email address"); return; }
    if (teamMembers.find(m => m.email === inviteEmail.trim())) { toast.error("Already a team member"); return; }

    setInviting(true);
    const perms = useCustom ? customPermissions : ROLES.find(r => r.id === selectedRole)?.permissions || [];

    try {
      // Invite as 'user' role in the app — channel-level role is stored separately
      await base44.users.inviteUser(inviteEmail.trim(), selectedRole === "admin" ? "admin" : "user");

      const newMember = {
        id: Date.now().toString(),
        email: inviteEmail.trim(),
        name: inviteEmail.split("@")[0],
        role: selectedRole,
        permissions: perms,
        invited_at: new Date().toISOString(),
        status: "invited",
      };
      saveTeam([...teamMembers, newMember]);
      toast.success(`Invited ${inviteEmail} as ${ROLES.find(r => r.id === selectedRole)?.label}`);
      setInviteEmail("");
      setSelectedRole("moderator");
      setCustomPermissions([]);
      setUseCustom(false);
      setShowInviteForm(false);
    } catch (e) {
      toast.error("Failed to invite: " + e.message);
    }
    setInviting(false);
  };

  const handleRemove = (id) => {
    saveTeam(teamMembers.filter(m => m.id !== id));
    toast.success("Team member removed");
  };

  const handleUpdateRole = (id, newRole) => {
    const perms = ROLES.find(r => r.id === newRole)?.permissions || [];
    saveTeam(teamMembers.map(m => m.id === id ? { ...m, role: newRole, permissions: perms } : m));
    setEditingMember(null);
    toast.success("Role updated");
  };

  const togglePerm = (permId) => {
    setCustomPermissions(prev =>
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const onRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setCustomPermissions(ROLES.find(r => r.id === roleId)?.permissions || []);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#e8f4ff]">Team Management</h2>
          <p className="text-sm text-blue-400/70 mt-0.5">Invite moderators and admins to help run your channel</p>
        </div>
        <Button onClick={() => setShowInviteForm(!showInviteForm)} className="gap-2">
          <UserPlus className="w-4 h-4" /> Invite Member
        </Button>
      </div>

      {/* Invite Form */}
      <AnimatePresence>
        {showInviteForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-5 space-y-5"
          >
            <h3 className="text-base font-bold text-[#e8f4ff]">Invite Team Member</h3>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-blue-400/70 uppercase tracking-wider mb-1.5 block">Email Address</label>
              <div className="flex items-center gap-2 bg-[#0a1525] border border-blue-900/40 rounded-xl px-3 py-2.5">
                <Mail className="w-4 h-4 text-blue-500/60 flex-shrink-0" />
                <input
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleInvite()}
                  placeholder="teammate@example.com"
                  className="flex-1 bg-transparent text-[#c8dff5] text-sm outline-none placeholder:text-blue-500/30"
                  style={{ background: "transparent", border: "none" }}
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="text-xs font-semibold text-blue-400/70 uppercase tracking-wider mb-2 block">Channel Role</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(role => {
                  const Icon = role.icon;
                  return (
                    <button
                      key={role.id}
                      onClick={() => onRoleSelect(role.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                        selectedRole === role.id
                          ? `${role.bg} ${role.color} border-opacity-80`
                          : "bg-[#0a1525] border-blue-900/30 text-blue-400/60 hover:border-blue-700/50"
                      }`}
                    >
                      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold">{role.label}</p>
                        <p className="text-xs opacity-70 leading-snug mt-0.5">{role.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Permissions */}
            <div>
              <button
                onClick={() => setUseCustom(!useCustom)}
                className="flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-200 transition-colors"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${useCustom ? "bg-[#1e78ff] border-[#1e78ff]" : "border-blue-700/50"}`}>
                  {useCustom && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                Customize permissions
              </button>

              {useCustom && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {ALL_PERMISSIONS.map(perm => (
                    <button
                      key={perm.id}
                      onClick={() => togglePerm(perm.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all ${
                        customPermissions.includes(perm.id)
                          ? "bg-[#1e78ff]/15 border-[#1e78ff]/40 text-[#1e78ff]"
                          : "bg-[#0a1525] border-blue-900/30 text-blue-400/60 hover:border-blue-700/50"
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${customPermissions.includes(perm.id) ? "bg-[#1e78ff] border-[#1e78ff]" : "border-blue-700/50"}`}>
                        {customPermissions.includes(perm.id) && <Check className="w-2 h-2 text-white" />}
                      </div>
                      {perm.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleInvite} disabled={inviting} className="flex-1">
                {inviting ? "Inviting..." : "Send Invite"}
              </Button>
              <Button variant="outline" onClick={() => setShowInviteForm(false)}>Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team Members List */}
      {teamMembers.length === 0 ? (
        <div className="text-center py-14 border border-dashed border-blue-900/40 rounded-2xl">
          <Users className="w-12 h-12 text-blue-900/50 mx-auto mb-3" />
          <p className="text-[#e8f4ff] font-semibold">No team members yet</p>
          <p className="text-blue-400/60 text-sm mt-1">Invite moderators or admins to help run your channel</p>
        </div>
      ) : (
        <div className="space-y-3">
          {teamMembers.map((member) => (
            <div key={member.id} className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#1e78ff]/20 border border-[#1e78ff]/40 flex items-center justify-center text-[#1e78ff] font-bold text-sm flex-shrink-0">
                    {member.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#e8f4ff] truncate">{member.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <RoleBadge roleId={member.role} />
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${member.status === "invited" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" : "bg-green-500/10 text-green-400 border border-green-500/20"}`}>
                        {member.status === "invited" ? "Pending" : "Active"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {editingMember === member.id ? (
                    <div className="flex items-center gap-1">
                      {ROLES.map(r => (
                        <button key={r.id} onClick={() => handleUpdateRole(member.id, r.id)}
                          className={`text-xs px-2 py-1 rounded-lg border transition-colors ${r.id === member.role ? `${r.bg} ${r.color}` : "border-blue-900/30 text-blue-400/60 hover:border-blue-700/50"}`}>
                          {r.label}
                        </button>
                      ))}
                      <button onClick={() => setEditingMember(null)} className="p-1 text-blue-500/60 hover:text-blue-300">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => setEditingMember(member.id)}
                        className="p-1.5 text-blue-500/60 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleRemove(member.id)}
                        className="p-1.5 text-red-500/60 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Permissions */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {member.permissions.map(permId => {
                  const perm = ALL_PERMISSIONS.find(p => p.id === permId);
                  return perm ? (
                    <span key={permId} className="text-xs px-2 py-0.5 bg-blue-900/20 border border-blue-900/40 text-blue-400/80 rounded-full">
                      {perm.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}