import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutTemplate, Plus, Search, Star, Users, Zap, Code2,
  Megaphone, Palette, Settings2, ShoppingCart, MoreVertical,
  Check, Copy, Trash2, Lock, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPageUrl } from "@/utils";

const CATEGORY_META = {
  engineering: { icon: Code2, color: "bg-blue-100 text-blue-700", label: "Engineering" },
  marketing: { icon: Megaphone, color: "bg-pink-100 text-pink-700", label: "Marketing" },
  design: { icon: Palette, color: "bg-purple-100 text-purple-700", label: "Design" },
  hr: { icon: Users, color: "bg-green-100 text-green-700", label: "HR" },
  sales: { icon: ShoppingCart, color: "bg-amber-100 text-amber-700", label: "Sales" },
  operations: { icon: Settings2, color: "bg-slate-100 text-slate-700", label: "Operations" },
  other: { icon: Zap, color: "bg-indigo-100 text-indigo-700", label: "Other" },
};

const BUILT_IN_TEMPLATES = [
  {
    id: "builtin_sprint",
    name: "Sprint Planning",
    description: "Standard 2-week agile sprint with backlog, in-progress and review stages.",
    category: "engineering",
    icon: "⚡",
    color: "#6366f1",
    is_public: true,
    use_count: 240,
    tags: ["agile", "scrum", "sprint"],
    custom_statuses: [
      { id: "backlog", name: "Backlog", color: "#94a3b8", order: 0 },
      { id: "todo", name: "To Do", color: "#6366f1", order: 1 },
      { id: "in_progress", name: "In Progress", color: "#f59e0b", order: 2 },
      { id: "review", name: "Review", color: "#8b5cf6", order: 3 },
      { id: "done", name: "Done", color: "#22c55e", order: 4 },
    ],
    tasks: [
      { title: "Define sprint goals", priority: "high", status: "todo", order: 0 },
      { title: "Break down user stories", priority: "high", status: "todo", order: 1 },
      { title: "Estimate story points", priority: "medium", status: "todo", order: 2 },
      { title: "Set up CI/CD pipeline", priority: "medium", status: "backlog", order: 3 },
      { title: "Code review process", priority: "low", status: "backlog", order: 4 },
    ],
  },
  {
    id: "builtin_launch",
    name: "Product Launch",
    description: "End-to-end product launch checklist covering marketing, dev, and ops.",
    category: "marketing",
    icon: "🚀",
    color: "#ec4899",
    is_public: true,
    use_count: 185,
    tags: ["launch", "gtm", "marketing"],
    custom_statuses: [
      { id: "todo", name: "Todo", color: "#94a3b8", order: 0 },
      { id: "in_progress", name: "In Progress", color: "#f59e0b", order: 1 },
      { id: "review", name: "Review", color: "#6366f1", order: 2 },
      { id: "completed", name: "Completed", color: "#22c55e", order: 3 },
    ],
    tasks: [
      { title: "Write press release", priority: "high", status: "todo", order: 0 },
      { title: "Prepare landing page", priority: "high", status: "todo", order: 1 },
      { title: "Set up analytics tracking", priority: "medium", status: "todo", order: 2 },
      { title: "Schedule social media posts", priority: "medium", status: "todo", order: 3 },
      { title: "Email newsletter campaign", priority: "high", status: "todo", order: 4 },
      { title: "Influencer outreach", priority: "low", status: "todo", order: 5 },
    ],
  },
  {
    id: "builtin_onboarding",
    name: "Employee Onboarding",
    description: "Structured onboarding flow for new hires from day 1 to 90 days.",
    category: "hr",
    icon: "👋",
    color: "#22c55e",
    is_public: true,
    use_count: 132,
    tags: ["onboarding", "hr", "people"],
    custom_statuses: [
      { id: "todo", name: "Pending", color: "#94a3b8", order: 0 },
      { id: "in_progress", name: "In Progress", color: "#f59e0b", order: 1 },
      { id: "completed", name: "Completed", color: "#22c55e", order: 2 },
    ],
    tasks: [
      { title: "Send welcome email & schedule first day", priority: "high", status: "todo", order: 0 },
      { title: "Set up laptop & accounts", priority: "high", status: "todo", order: 1 },
      { title: "30-day check-in meeting", priority: "medium", status: "todo", order: 2 },
      { title: "60-day performance review", priority: "medium", status: "todo", order: 3 },
      { title: "90-day feedback session", priority: "medium", status: "todo", order: 4 },
    ],
  },
  {
    id: "builtin_design",
    name: "Design System",
    description: "Build a comprehensive design system from discovery to documentation.",
    category: "design",
    icon: "🎨",
    color: "#8b5cf6",
    is_public: true,
    use_count: 98,
    tags: ["design", "ui", "system"],
    custom_statuses: [
      { id: "discovery", name: "Discovery", color: "#6366f1", order: 0 },
      { id: "design", name: "Design", color: "#8b5cf6", order: 1 },
      { id: "review", name: "Review", color: "#f59e0b", order: 2 },
      { id: "implemented", name: "Implemented", color: "#22c55e", order: 3 },
    ],
    tasks: [
      { title: "Audit existing UI components", priority: "high", status: "discovery", order: 0 },
      { title: "Define color tokens", priority: "high", status: "discovery", order: 1 },
      { title: "Typography scale", priority: "medium", status: "design", order: 2 },
      { title: "Component library setup", priority: "high", status: "design", order: 3 },
      { title: "Documentation site", priority: "medium", status: "design", order: 4 },
    ],
  },
];

function TemplateCard({ template, onUse, onDelete, isOwned }) {
  const meta = CATEGORY_META[template.category] || CATEGORY_META.other;
  const Icon = meta.icon;
  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
      <div className="h-2" style={{ backgroundColor: template.color || "#6366f1" }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{template.icon || "📋"}</span>
            <div>
              <h3 className="font-semibold text-slate-900">{template.name}</h3>
              <div className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1 ${meta.color}`}>
                <Icon className="w-3 h-3" />
                {meta.label}
              </div>
            </div>
          </div>
          {template.is_public ? <Globe className="w-4 h-4 text-slate-400" /> : <Lock className="w-4 h-4 text-slate-400" />}
        </div>

        <p className="text-sm text-slate-500 line-clamp-2 mb-3">{template.description}</p>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {template.tags?.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{tag}</span>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
          <span>{template.tasks?.length || 0} tasks · {template.custom_statuses?.length || 0} statuses</span>
          {template.use_count > 0 && <span>⭐ Used {template.use_count}×</span>}
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => onUse(template)}>
            <Copy className="w-3 h-3 mr-1.5" /> Use Template
          </Button>
          {isOwned && onDelete && (
            <Button size="sm" variant="outline" onClick={() => onDelete(template.id)} className="text-red-500 hover:text-red-600">
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Templates() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showUseDialog, setShowUseDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", category: "other", icon: "📋", color: "#6366f1", is_public: false, tags: "" });
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: myTemplates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.ProjectTemplate.list('-created_date'),
    enabled: !!user?.email,
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectTemplate.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templates'] }); setShowCreate(false); },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectTemplate.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  const allTemplates = [...BUILT_IN_TEMPLATES, ...myTemplates];
  const filtered = allTemplates.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || t.category === category;
    return matchSearch && matchCat;
  });

  const handleUse = (template) => {
    setSelectedTemplate(template);
    setNewProjectName(template.name);
    setShowUseDialog(true);
  };

  const handleCreateProject = async () => {
    if (!newProjectName || !selectedTemplate || !user) return;
    setCreating(true);
    try {
      const project = await base44.entities.Project.create({
        name: newProjectName,
        description: selectedTemplate.description,
        color: selectedTemplate.color,
        custom_statuses: selectedTemplate.custom_statuses || [],
        owner_email: user.email,
        team_members: [user.email],
        status: "planning",
      });
      // Create tasks
      for (const task of (selectedTemplate.tasks || [])) {
        await base44.entities.Task.create({
          ...task,
          project_id: project.id,
        });
      }
      // Increment use count if not built-in
      if (selectedTemplate.id && !selectedTemplate.id.startsWith('builtin_')) {
        await base44.entities.ProjectTemplate.update(selectedTemplate.id, {
          use_count: (selectedTemplate.use_count || 0) + 1
        });
      }
      setShowUseDialog(false);
      window.location.href = createPageUrl(`ProjectDetail?id=${project.id}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <LayoutTemplate className="w-6 h-6 text-indigo-600" /> Template Library
            </h1>
            <p className="text-slate-500 text-sm mt-1">Start your next project from a proven workflow</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Save as Template
          </Button>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..." className="pl-9" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORY_META).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <LayoutTemplate className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No templates found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(t => (
              <TemplateCard
                key={t.id}
                template={t}
                onUse={handleUse}
                onDelete={!t.id?.startsWith('builtin_') ? (id) => deleteTemplateMutation.mutate(id) : null}
                isOwned={t.created_by === user?.email}
              />
            ))}
          </div>
        )}
      </div>

      {/* Use Template Dialog */}
      <Dialog open={showUseDialog} onOpenChange={setShowUseDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Use "{selectedTemplate?.name}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>New Project Name</Label>
              <Input value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="My Project" />
            </div>
            {selectedTemplate && (
              <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600 space-y-1">
                <p>✅ {selectedTemplate.tasks?.length || 0} tasks will be created</p>
                <p>🏷️ {selectedTemplate.custom_statuses?.length || 0} custom statuses</p>
              </div>
            )}
            <Button onClick={handleCreateProject} disabled={creating || !newProjectName} className="w-full">
              {creating ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Template name" />
              </div>
              <div>
                <Label>Icon</Label>
                <Input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="📋" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_META).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tags (comma-sep)</Label>
                <Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="agile, sprint" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="public" checked={form.is_public} onChange={e => setForm({ ...form, is_public: e.target.checked })} />
              <label htmlFor="public" className="text-sm text-slate-600">Make public for all users</label>
            </div>
            <Button
              className="w-full"
              disabled={!form.name || createTemplateMutation.isPending}
              onClick={() => createTemplateMutation.mutate({
                ...form,
                tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
              })}
            >
              {createTemplateMutation.isPending ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}