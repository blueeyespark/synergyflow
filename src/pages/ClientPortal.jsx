import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Globe, Copy, Eye, Trash2, Users, CheckCircle, MessageSquare, Link, Settings, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import PortalView from "@/components/clientportal/PortalView";

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export default function ClientPortal() {
  const [user, setUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [viewingPortal, setViewingPortal] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', project_id: '',
    stakeholder_emails: '', allow_comments: true, allow_approvals: true,
    shared_sections: ['progress', 'deliverables'],
    branding_color: '#6366f1',
  });
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: portals = [], isLoading } = useQuery({
    queryKey: ['client-portals'],
    queryFn: () => base44.entities.ClientPortal.list('-created_date'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
    enabled: !!user,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['client-comments'],
    queryFn: () => base44.entities.ClientComment.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientPortal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-portals'] });
      setShowCreate(false);
      toast.success('Client portal created!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ClientPortal.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client-portals'] }),
  });

  const handleCreate = () => {
    const project = projects.find(p => p.id === form.project_id);
    createMutation.mutate({
      ...form,
      project_name: project?.name || '',
      owner_email: user?.email,
      access_token: generateToken(),
      stakeholder_emails: form.stakeholder_emails.split(',').map(e => e.trim()).filter(Boolean),
    });
  };

  const copyLink = (portal) => {
    const url = `${window.location.origin}/portal/${portal.access_token}`;
    navigator.clipboard.writeText(url);
    toast.success('Portal link copied!');
  };

  const toggleSection = (section) => {
    setForm(f => ({
      ...f,
      shared_sections: f.shared_sections.includes(section)
        ? f.shared_sections.filter(s => s !== section)
        : [...f.shared_sections, section],
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Globe className="w-6 h-6 text-indigo-500" /> Client Portals
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Share project progress with external stakeholders — no login required</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> New Portal
          </Button>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-40 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />)}
          </div>
        ) : portals.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
            <Globe className="w-14 h-14 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No portals yet</h3>
            <p className="text-sm text-slate-400 mt-1 mb-6">Create a portal to share project updates with clients</p>
            <Button onClick={() => setShowCreate(true)} variant="outline">Create your first portal</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {portals.map(portal => {
              const portalComments = comments.filter(c => c.portal_id === portal.id);
              const pendingApprovals = portalComments.filter(c => c.is_approval && c.approval_status === 'pending').length;
              return (
                <motion.div key={portal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="h-1.5" style={{ backgroundColor: portal.branding_color || '#6366f1' }} />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{portal.title}</h3>
                        {portal.project_name && <p className="text-xs text-slate-400 mt-0.5">📁 {portal.project_name}</p>}
                      </div>
                      <Badge className={portal.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}>
                        {portal.status}
                      </Badge>
                    </div>
                    {portal.description && <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{portal.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{portal.stakeholder_emails?.length || 0} stakeholders</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{portalComments.length} comments</span>
                      {pendingApprovals > 0 && (
                        <Badge className="bg-amber-100 text-amber-700 text-xs">{pendingApprovals} pending</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => setViewingPortal(portal)}>
                        <Eye className="w-3 h-3" /> Preview
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => copyLink(portal)}>
                        <Copy className="w-3 h-3" /> Copy Link
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600" onClick={() => deleteMutation.mutate(portal.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Globe className="w-4 h-4 text-indigo-500" /> Create Client Portal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Portal Title *</Label>
              <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Q1 Project Update" />
            </div>
            <div>
              <Label>Link to Project</Label>
              <Select value={form.project_id} onValueChange={v => setForm({...form, project_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select a project" /></SelectTrigger>
                <SelectContent>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Brief summary for stakeholders" />
            </div>
            <div>
              <Label>Stakeholder Emails (comma-separated)</Label>
              <Input value={form.stakeholder_emails} onChange={e => setForm({...form, stakeholder_emails: e.target.value})} placeholder="client@example.com, ceo@corp.com" />
            </div>
            <div>
              <Label className="mb-2 block">Shared Sections</Label>
              <div className="grid grid-cols-2 gap-2">
                {['progress', 'timeline', 'deliverables', 'budget'].map(s => (
                  <div key={s} className="flex items-center gap-2">
                    <Checkbox checked={form.shared_sections.includes(s)} onCheckedChange={() => toggleSection(s)} />
                    <span className="text-sm capitalize text-slate-700 dark:text-slate-300">{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox checked={form.allow_comments} onCheckedChange={v => setForm({...form, allow_comments: v})} />
                <span className="text-sm text-slate-700 dark:text-slate-300">Allow comments</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={form.allow_approvals} onCheckedChange={v => setForm({...form, allow_approvals: v})} />
                <span className="text-sm text-slate-700 dark:text-slate-300">Allow approvals</span>
              </div>
            </div>
            <div>
              <Label>Brand Color</Label>
              <input type="color" value={form.branding_color} onChange={e => setForm({...form, branding_color: e.target.value})}
                className="h-9 w-full rounded-md border border-slate-200 cursor-pointer" />
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={!form.title || createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Portal'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {viewingPortal && (
        <PortalView portal={viewingPortal} onClose={() => setViewingPortal(null)} isPreview={true} />
      )}
    </div>
  );
}