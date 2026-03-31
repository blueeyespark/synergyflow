import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookTemplate, Loader2 } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["engineering", "marketing", "design", "hr", "sales", "operations", "other"];

export default function SaveAsTemplateModal({ open, onOpenChange, project, tasks }) {
  const [name, setName] = useState(project?.name ? `${project.name} Template` : "");
  const [description, setDescription] = useState(project?.description || "");
  const [category, setCategory] = useState("other");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    const templateTasks = (tasks || []).map((t, i) => ({
      title: t.title,
      description: t.description || "",
      priority: t.priority || "medium",
      status: "todo",
      order: i,
    }));

    const customStatuses = project?.custom_statuses || [];

    await base44.entities.ProjectTemplate.create({
      name: name.trim(),
      description: description.trim(),
      category,
      color: project?.color || "#6366f1",
      is_public: false,
      tasks: templateTasks,
      custom_statuses: customStatuses,
      use_count: 0,
    });

    toast.success(`Template "${name}" saved!`);
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookTemplate className="w-5 h-5 text-indigo-600" />
            Save as Template
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="text-sm text-slate-500">
            This will save the project structure ({(tasks || []).length} tasks, {(project?.custom_statuses || []).length} custom statuses) as a reusable template.
          </p>
          <div>
            <Label>Template Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="My Project Template" className="mt-1" />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this template for?" className="mt-1" />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookTemplate className="w-4 h-4 mr-2" />}
              Save Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}