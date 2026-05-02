import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  LayoutTemplate, Plus, Search, Copy, Trash2, Lock, Globe, Code2,
  Megaphone, Palette, Settings2, ShoppingCart
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
import { toast } from "sonner";

const CATEGORY_META = {
  engineering: { icon: Code2, color: "bg-blue-500/10 text-blue-400", label: "Engineering" },
  marketing: { icon: Megaphone, color: "bg-pink-500/10 text-pink-400", label: "Marketing" },
  design: { icon: Palette, color: "bg-purple-500/10 text-purple-400", label: "Design" },
  sales: { icon: ShoppingCart, color: "bg-amber-500/10 text-amber-400", label: "Sales" },
  other: { icon: LayoutTemplate, color: "bg-indigo-500/10 text-indigo-400", label: "Other" },
};

const BUILT_IN_TEMPLATES = [
  {
    id: "builtin_sprint",
    name: "Sprint Planning",
    description: "2-week agile sprint with backlog, in-progress and review stages.",
    category: "engineering",
    icon: "⚡",
    color: "#6366f1",
    is_public: true,
    use_count: 240,
    tags: ["agile", "scrum"],
  },
  {
    id: "builtin_launch",
    name: "Product Launch",
    description: "End-to-end product launch checklist.",
    category: "marketing",
    icon: "🚀",
    color: "#ec4899",
    is_public: true,
    use_count: 185,
    tags: ["launch", "gtm"],
  },
];

function TemplateCard({ template, onUse, onDelete, isOwned }) {
  const meta = CATEGORY_META[template.category] || CATEGORY_META.other;
  const Icon = meta.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-[#060d18] border border-blue-900/40 rounded-lg p-4 hover:border-blue-600/60 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{template.icon || "📋"}</span>
            <h3 className="font-semibold text-[#e8f4ff]">{template.name}</h3>
          </div>
          <div className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${meta.color}`}>
            <Icon className="w-3 h-3" />
            {meta.label}
          </div>
        </div>
        {template.is_public ? <Globe className="w-4 h-4 text-blue-400/40" /> : <Lock className="w-4 h-4 text-blue-400/40" />}
      </div>

      <p className="text-xs text-blue-400/60 line-clamp-2 mb-3">{template.description}</p>

      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={() => onUse(template)}>
          <Copy className="w-3 h-3 mr-1" /> Use
        </Button>
        {isOwned && onDelete && (
          <Button size="sm" variant="outline" onClick={() => onDelete(template.id)} className="text-red-400 hover:bg-red-900/20">
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export default function TemplatesTab() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [showUseDialog, setShowUseDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: myTemplates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.ProjectTemplate.list('-created_date'),
    enabled: !!user?.email,
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectTemplate.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templates'] }); toast.success("Template deleted"); },
  });

  const allTemplates = [...BUILT_IN_TEMPLATES, ...myTemplates];
  const filtered = allTemplates.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));

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
        owner_email: user.email,
      });
      setShowUseDialog(false);
      toast.success("Project created");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Templates</h2>
          <p className="text-sm text-muted-foreground mt-1">Start projects from proven workflows</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400/40" />
        <Input 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          placeholder="Search templates..." 
          className="pl-9 bg-[#0a1525] border-blue-900/40" 
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <LayoutTemplate className="w-8 h-8 text-blue-400/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No templates found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            <Button onClick={handleCreateProject} disabled={creating || !newProjectName} className="w-full">
              {creating ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}