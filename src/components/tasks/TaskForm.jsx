import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Link2, Plus, X, Image, Copy } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import ReminderSelector from "./ReminderSelector";

export default function TaskForm({ open, onOpenChange, task, projectId, reminderGroups, teamMembers, allTasks, onSubmit, isLoading, onDuplicate }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    due_date: "",
    start_date: "",
    assigned_to: "",
    project_id: projectId,
    reminder_group_id: "",
    depends_on: [],
    reminders: [],
    steps: [],
    image_urls: []
  });
  const [newStep, setNewStep] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "todo",
        priority: task.priority || "medium",
        due_date: task.due_date || "",
        start_date: task.start_date || "",
        assigned_to: task.assigned_to || "",
        project_id: task.project_id || projectId,
        reminder_group_id: task.reminder_group_id || "",
        depends_on: task.depends_on || [],
        reminders: task.reminders || [],
        steps: task.steps || [],
        image_urls: task.image_urls || []
      });
    } else {
      setFormData({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        due_date: "",
        start_date: "",
        assigned_to: "",
        project_id: projectId,
        reminder_group_id: "",
        depends_on: [],
        reminders: [],
        steps: [],
        image_urls: []
      });
    }
  }, [task, projectId, open]);

  const addStep = () => {
    if (newStep.trim()) {
      setFormData({
        ...formData,
        steps: [...formData.steps, { id: Date.now().toString(), title: newStep, completed: false }]
      });
      setNewStep("");
    }
  };

  const removeStep = (stepId) => {
    setFormData({ ...formData, steps: formData.steps.filter(s => s.id !== stepId) });
  };

  const toggleStep = (stepId) => {
    setFormData({
      ...formData,
      steps: formData.steps.map(s => s.id === stepId ? { ...s, completed: !s.completed } : s)
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, image_urls: [...formData.image_urls, file_url] });
    } catch (error) {
      console.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setFormData({ ...formData, image_urls: formData.image_urls.filter((_, i) => i !== index) });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const availableTasks = (allTasks || []).filter(t => t.id !== task?.id);
  
  const toggleDependency = (taskId) => {
    setFormData(prev => ({
      ...prev,
      depends_on: prev.depends_on.includes(taskId)
        ? prev.depends_on.filter(id => id !== taskId)
        : [...prev.depends_on, taskId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{task ? "Edit Task" : "Create Task"}</DialogTitle>
            {task && onDuplicate && (
              <Button type="button" variant="outline" size="sm" onClick={() => onDuplicate(task)}>
                <Copy className="w-4 h-4 mr-1" /> Duplicate
              </Button>
            )}
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What needs to be done?"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add more details..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.start_date ? format(new Date(formData.start_date), "MMM d") : "Start"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.start_date ? new Date(formData.start_date) : undefined}
                    onSelect={(date) => setFormData({ ...formData, start_date: date?.toISOString().split('T')[0] || "" })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date ? format(new Date(formData.due_date), "MMM d") : "Due"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.due_date ? new Date(formData.due_date) : undefined}
                    onSelect={(date) => setFormData({ ...formData, due_date: date?.toISOString().split('T')[0] || "" })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <ReminderSelector
            reminders={formData.reminders}
            onChange={(reminders) => setFormData({ ...formData, reminders })}
            dueDate={formData.due_date}
          />

          {/* Steps/Subtasks */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Plus className="w-4 h-4" /> Steps
            </Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newStep}
                onChange={(e) => setNewStep(e.target.value)}
                placeholder="Add a step"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addStep())}
              />
              <Button type="button" onClick={addStep} size="sm">Add</Button>
            </div>
            {formData.steps.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {formData.steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded text-sm">
                    <Checkbox checked={step.completed} onCheckedChange={() => toggleStep(step.id)} />
                    <span className={step.completed ? 'line-through text-slate-400' : ''}>{step.title}</span>
                    <button type="button" onClick={() => removeStep(step.id)} className="ml-auto text-slate-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Images */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Image className="w-4 h-4" /> Images
            </Label>
            <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
            {formData.image_urls.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {formData.image_urls.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="" className="w-16 h-16 object-cover rounded" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reminder Group */}
          {reminderGroups && reminderGroups.length > 0 && (
            <div>
              <Label>Reminder Group</Label>
              <Select
                value={formData.reminder_group_id || "none"}
                onValueChange={(value) => setFormData({ ...formData, reminder_group_id: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Group</SelectItem>
                  {reminderGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {teamMembers && teamMembers.length > 0 && (
            <div>
              <Label>Assign To</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Unassigned</SelectItem>
                  {teamMembers.map((email) => (
                    <SelectItem key={email} value={email}>
                      {email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {availableTasks.length > 0 && (
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Link2 className="w-4 h-4" />
                Dependencies
              </Label>
              <p className="text-xs text-slate-500 mb-3">
                Select tasks that must be completed before this task can start
              </p>
              <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto">
                {availableTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-start gap-3 p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                  >
                    <Checkbox
                      checked={formData.depends_on.includes(t.id)}
                      onCheckedChange={() => toggleDependency(t.id)}
                      id={`dep-${t.id}`}
                    />
                    <label
                      htmlFor={`dep-${t.id}`}
                      className="flex-1 text-sm cursor-pointer"
                    >
                      <p className="font-medium text-slate-900">{t.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t.status === 'completed' ? '✓ Completed' : `Status: ${t.status.replace('_', ' ')}`}
                      </p>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : task ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}