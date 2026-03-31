import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FolderKanban, CheckSquare, ListTodo, LayoutTemplate, Loader2, Sparkles } from "lucide-react";

export default function QuickScheduleModal({ open, onOpenChange, selectedDate }) {
  const [tab, setTab] = useState("task");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", project_id: "", planner_id: "", priority: "medium" });
  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list(),
    enabled: open,
  });

  const { data: planners = [] } = useQuery({
    queryKey: ["planners"],
    queryFn: () => base44.entities.Planner.list(),
    enabled: open,
  });

  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ["templates"],
    queryFn: () => base44.entities.ProjectTemplate.list(),
    enabled: open,
  });

  const [projectType, setProjectType] = useState("");
  const [generatingTemplate, setGeneratingTemplate] = useState(false);

  const handleGenerateTemplate = async () => {
    if (!projectType) { toast.error("Select project type"); return; }
    setGeneratingTemplate(true);
    try {
      const res = await base44.functions.invoke('generateAITemplates', { projectType });
      if (res.data?.template) {
        queryClient.invalidateQueries({ queryKey: ["templates"] });
        toast.success(`AI template created: ${res.data.template.name}`);
        setProjectType("");
      }
    } catch (err) {
      toast.error("Failed to generate template");
    } finally {
      setGeneratingTemplate(false);
    }
  };

  const handleCreateTask = async () => {
    if (!form.title) { toast.error("Title required"); return; }
    setSubmitting(true);
    await base44.entities.Task.create({
      title: form.title,
      due_date: format(selectedDate, "yyyy-MM-dd"),
      priority: form.priority,
      project_id: form.project_id || null,
      status: "todo",
    });
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    toast.success("Task scheduled");
    setForm({ title: "", project_id: "", planner_id: "", priority: "medium" });
    onOpenChange(false);
    setSubmitting(false);
  };

  const handleCreateProject = async () => {
    if (!form.title) { toast.error("Title required"); return; }
    setSubmitting(true);
    await base44.entities.Project.create({
      name: form.title,
      due_date: format(selectedDate, "yyyy-MM-dd"),
      priority: form.priority,
      status: "planning",
    });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    toast.success("Project created");
    setForm({ title: "", project_id: "", planner_id: "", priority: "medium" });
    onOpenChange(false);
    setSubmitting(false);
  };

  const handleCreatePlanner = async () => {
    if (!form.title) { toast.error("Title required"); return; }
    setSubmitting(true);
    await base44.entities.Planner.create({
      name: form.title,
      is_private: true,
    });
    queryClient.invalidateQueries({ queryKey: ["planners"] });
    toast.success("Planner created");
    setForm({ title: "", project_id: "", planner_id: "", priority: "medium" });
    onOpenChange(false);
    setSubmitting(false);
  };

  const handleUseTemplate = async () => {
    if (!form.project_id) { toast.error("Select a template"); return; }
    setSubmitting(true);
    const template = templates.find(t => t.id === form.project_id);
    if (template) {
      await base44.entities.Project.create({
        name: form.title || template.name,
        due_date: format(selectedDate, "yyyy-MM-dd"),
        status: "planning",
        priority: template.category ? "medium" : "low",
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success(`Project created from ${template.name} template`);
      setForm({ title: "", project_id: "", planner_id: "", priority: "medium" });
      onOpenChange(false);
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule for {format(selectedDate, "MMM d, yyyy")}</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="task" className="text-xs gap-1"><CheckSquare className="w-3 h-3" /> Task</TabsTrigger>
            <TabsTrigger value="project" className="text-xs gap-1"><FolderKanban className="w-3 h-3" /> Project</TabsTrigger>
            <TabsTrigger value="planner" className="text-xs gap-1"><ListTodo className="w-3 h-3" /> Planner</TabsTrigger>
            <TabsTrigger value="template" className="text-xs gap-1"><LayoutTemplate className="w-3 h-3" /> Template</TabsTrigger>
          </TabsList>

          {/* Task Tab */}
          <TabsContent value="task" className="space-y-3 mt-4">
            <div>
              <Label>Task Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Complete report"
              />
            </div>
            <div>
              <Label>Project (optional)</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleCreateTask} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create Task
            </Button>
          </TabsContent>

          {/* Project Tab */}
          <TabsContent value="project" className="space-y-3 mt-4">
            <div>
              <Label>Project Name</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Q2 Marketing Campaign"
              />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleCreateProject} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create Project
            </Button>
          </TabsContent>

          {/* Planner Tab */}
          <TabsContent value="planner" className="space-y-3 mt-4">
            <div>
              <Label>Planner Name</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Sprint Planning"
              />
            </div>
            <p className="text-xs text-slate-500">Planners help organize tasks without a full project scope.</p>
            <Button className="w-full" onClick={handleCreatePlanner} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create Planner
            </Button>
          </TabsContent>

          {/* Template Tab */}
          <TabsContent value="template" className="space-y-3 mt-4">
            <div>
              <Label>Project Name (optional)</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Leave blank to use template name"
              />
            </div>
            <div>
              <Label>Select Template</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingTemplates ? "Loading..." : "Choose template"} />
                </SelectTrigger>
                <SelectContent>
                  {templates && templates.length > 0 ? (
                    templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)
                  ) : (
                    <div className="p-2 text-xs text-slate-500">No templates available</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleUseTemplate} disabled={submitting || !form.project_id}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create from Template
            </Button>

            {/* AI Template Generator */}
            <div className="border-t pt-3 mt-3">
              <Label className="text-sm font-semibold mb-2">Or Generate AI Template</Label>
              <Select value={projectType} onValueChange={setProjectType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketing">Marketing Campaign</SelectItem>
                  <SelectItem value="product">Product Launch</SelectItem>
                  <SelectItem value="design">Design System</SelectItem>
                  <SelectItem value="engineering">Engineering Sprint</SelectItem>
                  <SelectItem value="sales">Sales Proposal</SelectItem>
                  <SelectItem value="hr">Onboarding</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={handleGenerateTemplate}
                disabled={generatingTemplate || !projectType}
              >
                {generatingTemplate ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Generate Template
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}