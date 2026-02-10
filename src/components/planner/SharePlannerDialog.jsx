import { useState } from "react";
import { Users, Trash2, Eye, MessageSquare, Pencil, Mail, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";

const roleColors = {
  viewer: "bg-slate-100 text-slate-700",
  commenter: "bg-blue-100 text-blue-700",
  editor: "bg-green-100 text-green-700"
};

const roleDescriptions = {
  viewer: "Can view tasks and comments",
  commenter: "Can view and add comments",
  editor: "Can edit tasks and settings"
};

export default function SharePlannerDialog({ open, onOpenChange, planner, onUpdate }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [copied, setCopied] = useState(false);

  const handleInvite = () => {
    if (!email.trim()) return;
    
    const existingShares = planner?.shared_with || [];
    if (existingShares.some(s => s.email === email)) {
      toast.error("Already shared with this user");
      return;
    }

    onUpdate({
      shared_with: [
        ...existingShares,
        { email: email.trim(), role, invited_at: new Date().toISOString() }
      ]
    });
    setEmail("");
    toast.success(`Invited ${email} as ${role}`);
  };

  const handleRemove = (emailToRemove) => {
    onUpdate({
      shared_with: (planner?.shared_with || []).filter(s => s.email !== emailToRemove)
    });
    toast.success("Removed access");
  };

  const handleRoleChange = (emailToUpdate, newRole) => {
    onUpdate({
      shared_with: (planner?.shared_with || []).map(s => 
        s.email === emailToUpdate ? { ...s, role: newRole } : s
      )
    });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/PlannerDetail?id=${planner?.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Share "{planner?.name}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Invite */}
          <div>
            <Label>Invite people</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                type="email"
              />
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Viewer</span>
                  </SelectItem>
                  <SelectItem value="commenter">
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Commenter</span>
                  </SelectItem>
                  <SelectItem value="editor">
                    <span className="flex items-center gap-1"><Pencil className="w-3 h-3" /> Editor</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleInvite}>
                <Mail className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">{roleDescriptions[role]}</p>
          </div>

          {/* Copy Link */}
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
            <Input 
              value={`${window.location.origin}/PlannerDetail?id=${planner?.id}`}
              readOnly
              className="text-xs bg-white"
            />
            <Button variant="outline" size="icon" onClick={copyLink}>
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          {/* Shared List */}
          {planner?.shared_with?.length > 0 && (
            <div>
              <Label className="mb-2 block">People with access</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {planner.shared_with.map((share) => (
                  <div key={share.email} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium text-sm">
                        {share.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{share.email}</p>
                        <Badge className={`text-xs ${roleColors[share.role]}`}>{share.role}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Select value={share.role} onValueChange={(v) => handleRoleChange(share.email, v)}>
                        <SelectTrigger className="h-7 w-24 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="commenter">Commenter</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemove(share.email)}>
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}