import { useState } from "react";
import { Users, Trash2, Eye, MessageSquare, Pencil, Mail, Copy, Check, Crown } from "lucide-react";
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
  owner: "bg-amber-100 text-amber-700",
  viewer: "bg-slate-100 text-slate-700",
  commenter: "bg-blue-100 text-blue-700",
  editor: "bg-green-100 text-green-700"
};

const roleDescriptions = {
  viewer: "Can view content only",
  commenter: "Can view and add comments",
  editor: "Can edit content and settings"
};

const roleIcons = {
  owner: Crown,
  viewer: Eye,
  commenter: MessageSquare,
  editor: Pencil
};

export default function ShareDialog({ 
  open, 
  onOpenChange, 
  title,
  entityType,
  entityId,
  ownerEmail,
  sharedWith = [],
  onUpdate 
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [copied, setCopied] = useState(false);

  const handleInvite = () => {
    if (!email.trim()) return;
    
    if (sharedWith.some(s => s.email === email)) {
      toast.error("Already shared with this user");
      return;
    }

    if (email === ownerEmail) {
      toast.error("Cannot share with owner");
      return;
    }

    onUpdate({
      shared_with: [
        ...sharedWith,
        { email: email.trim(), role, invited_at: new Date().toISOString() }
      ]
    });
    setEmail("");
    toast.success(`Invited ${email} as ${role}`);
  };

  const handleRemove = (emailToRemove) => {
    onUpdate({
      shared_with: sharedWith.filter(s => s.email !== emailToRemove)
    });
    toast.success("Removed access");
  };

  const handleRoleChange = (emailToUpdate, newRole) => {
    onUpdate({
      shared_with: sharedWith.map(s => 
        s.email === emailToUpdate ? { ...s, role: newRole } : s
      )
    });
    toast.success("Role updated");
  };

  const shareUrl = `${window.location.origin}/${entityType}Detail?id=${entityId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
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
            Share "{title}"
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
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
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
              value={shareUrl}
              readOnly
              className="text-xs bg-white"
            />
            <Button variant="outline" size="icon" onClick={copyLink}>
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          {/* People with Access */}
          <div>
            <Label className="mb-2 block">People with access</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {/* Owner */}
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-medium text-sm">
                    {ownerEmail?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{ownerEmail}</p>
                    <Badge className={roleColors.owner}>
                      <Crown className="w-3 h-3 mr-1" /> Owner
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Shared Users */}
              {sharedWith.map((share) => {
                const RoleIcon = roleIcons[share.role];
                return (
                  <div key={share.email} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium text-sm">
                        {share.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{share.email}</p>
                        <Badge className={`text-xs ${roleColors[share.role]}`}>
                          <RoleIcon className="w-3 h-3 mr-1" />
                          {share.role}
                        </Badge>
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
                );
              })}

              {sharedWith.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">
                  Not shared with anyone yet
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}