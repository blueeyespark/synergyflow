import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { 
  Plus, FolderOpen, Share2, Link2, MoreVertical, 
  Edit, Trash2, Copy, Image, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#22c55e", "#0ea5e9"];

export default function ReminderGroupsPage() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: colors[0],
    image_url: "",
    social_links: []
  });
  const [newLink, setNewLink] = useState({ platform: "", url: "" });
  
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: groups = [] } = useQuery({
    queryKey: ['remindergroups'],
    queryFn: () => base44.entities.ReminderGroup.list('-created_date'),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ReminderGroup.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remindergroups'] });
      setShowForm(false);
      resetForm();
      toast.success("Group created");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ReminderGroup.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remindergroups'] });
      setShowForm(false);
      setShowShareDialog(false);
      setEditingGroup(null);
      resetForm();
      toast.success("Group updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ReminderGroup.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remindergroups'] });
      toast.success("Group deleted");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (group) => {
      const { id, created_date, updated_date, created_by, ...data } = group;
      return base44.entities.ReminderGroup.create({
        ...data,
        name: `${data.name} (Copy)`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remindergroups'] });
      toast.success("Group duplicated");
    },
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", color: colors[0], image_url: "", social_links: [] });
    setNewLink({ platform: "", url: "" });
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name || "",
      description: group.description || "",
      color: group.color || colors[0],
      image_url: group.image_url || "",
      social_links: group.social_links || []
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, image_url: file_url });
      toast.success("Image uploaded");
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const addSocialLink = () => {
    if (newLink.platform && newLink.url) {
      setFormData({ ...formData, social_links: [...formData.social_links, newLink] });
      setNewLink({ platform: "", url: "" });
    }
  };

  const removeSocialLink = (index) => {
    setFormData({ 
      ...formData, 
      social_links: formData.social_links.filter((_, i) => i !== index) 
    });
  };

  const handleShare = () => {
    if (!shareEmail || !selectedGroup) return;
    const currentShared = selectedGroup.shared_with || [];
    if (!currentShared.includes(shareEmail)) {
      updateMutation.mutate({
        id: selectedGroup.id,
        data: { shared_with: [...currentShared, shareEmail], is_shared: true }
      });
    }
    setShareEmail("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getGroupTaskCount = (groupId) => {
    return tasks.filter(t => t.reminder_group_id === groupId).length;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Reminder Groups</h1>
            <p className="text-slate-500 mt-1">Organize tasks into categories</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            New Group
          </Button>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {group.image_url ? (
                <div className="h-32 bg-slate-100">
                  <img src={group.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-4" style={{ backgroundColor: group.color || '#6366f1' }} />
              )}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-slate-100">
                      <FolderOpen className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{group.name}</h3>
                      <p className="text-xs text-slate-500">{getGroupTaskCount(group.id)} tasks</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(group)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setSelectedGroup(group); setShowShareDialog(true); }}>
                        <Share2 className="w-4 h-4 mr-2" /> Share
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateMutation.mutate(group)}>
                        <Copy className="w-4 h-4 mr-2" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteMutation.mutate(group.id)} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {group.description && (
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">{group.description}</p>
                )}

                {group.social_links?.length > 0 && (
                  <div className="flex gap-1 mb-3">
                    {group.social_links.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-slate-100 px-2 py-1 rounded hover:bg-slate-200"
                      >
                        {link.platform}
                      </a>
                    ))}
                  </div>
                )}

                {group.is_shared && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Users className="w-3 h-3" />
                    Shared with {group.shared_with?.length || 0} people
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {groups.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-medium text-slate-900">No groups yet</h3>
            <p className="text-sm text-slate-500 mt-1">Create your first reminder group</p>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) { setEditingGroup(null); resetForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGroup ? "Edit Group" : "Create Group"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label>Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full ${formData.color === color ? 'ring-2 ring-offset-2' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label>Image</Label>
              <Input type="file" onChange={handleImageUpload} disabled={uploading} accept="image/*" />
              {formData.image_url && <img src={formData.image_url} alt="" className="w-full h-24 object-cover rounded mt-2" />}
            </div>
            <div>
              <Label>Social Links</Label>
              <div className="flex gap-2 mb-2">
                <Input placeholder="Platform" value={newLink.platform} onChange={(e) => setNewLink({ ...newLink, platform: e.target.value })} />
                <Input placeholder="URL" value={newLink.url} onChange={(e) => setNewLink({ ...newLink, url: e.target.value })} />
                <Button type="button" onClick={addSocialLink}>Add</Button>
              </div>
              {formData.social_links.map((link, i) => (
                <Badge key={i} variant="secondary" className="mr-1 mb-1">
                  {link.platform} <button type="button" onClick={() => removeSocialLink(i)}>×</button>
                </Badge>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">{editingGroup ? "Update" : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share "{selectedGroup?.name}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Input placeholder="Email address" value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} />
              <Button onClick={handleShare}>Share</Button>
            </div>
            {selectedGroup?.shared_with?.length > 0 && (
              <div>
                <Label className="text-xs text-slate-500">Shared with:</Label>
                {selectedGroup.shared_with.map((email) => (
                  <Badge key={email} variant="secondary" className="mr-1">{email}</Badge>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}