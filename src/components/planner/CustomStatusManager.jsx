import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const defaultColors = ['#64748b', '#3b82f6', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9'];

export default function CustomStatusManager({ open, onOpenChange, statuses, onSave }) {
  const [localStatuses, setLocalStatuses] = useState([]);
  const [newStatus, setNewStatus] = useState({ name: "", color: "#3b82f6" });

  useEffect(() => {
    setLocalStatuses(statuses || []);
  }, [statuses, open]);

  const addStatus = () => {
    if (!newStatus.name.trim()) return;
    const id = newStatus.name.toLowerCase().replace(/\s+/g, '_');
    setLocalStatuses([
      ...localStatuses,
      { id, name: newStatus.name, color: newStatus.color, order: localStatuses.length }
    ]);
    setNewStatus({ name: "", color: "#3b82f6" });
  };

  const removeStatus = (id) => {
    setLocalStatuses(localStatuses.filter(s => s.id !== id));
  };

  const updateStatus = (id, field, value) => {
    setLocalStatuses(localStatuses.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const handleSave = () => {
    onSave(localStatuses);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Custom Task Statuses</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Existing Statuses */}
          <div className="space-y-2">
            {localStatuses.map((status, index) => (
              <div key={status.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
                <input
                  type="color"
                  value={status.color}
                  onChange={(e) => updateStatus(status.id, 'color', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0"
                />
                <Input
                  value={status.name}
                  onChange={(e) => updateStatus(status.id, 'name', e.target.value)}
                  className="flex-1"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => removeStatus(status.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add New Status */}
          <div className="p-3 border-2 border-dashed border-slate-200 rounded-lg">
            <Label className="mb-2 block text-sm">Add New Status</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newStatus.color}
                onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border-0"
              />
              <Input
                value={newStatus.name}
                onChange={(e) => setNewStatus({ ...newStatus, name: e.target.value })}
                placeholder="Status name"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && addStatus()}
              />
              <Button onClick={addStatus} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-1 mt-2">
              {defaultColors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewStatus({ ...newStatus, color })}
                  className={`w-5 h-5 rounded transition-all ${newStatus.color === color ? 'ring-2 ring-offset-1 ring-indigo-500' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}