import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UserPlus, Mail, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function InviteTeamDialog({ open, onOpenChange, project, onInvited }) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      // Invite user to the app
      await base44.users.inviteUser(email.trim(), "user");
      
      // Add to project team members
      const updatedMembers = [...(project.team_members || []), email.trim()];
      await base44.entities.Project.update(project.id, {
        team_members: updatedMembers
      });

      // Create notification for the invited user
      await base44.entities.Notification.create({
        user_email: email.trim(),
        type: "team_invite",
        title: "You've been invited to a project",
        message: `You've been added to the project "${project.name}"`,
        project_id: project.id
      });

      toast.success(`Invitation sent to ${email}`);
      setEmail("");
      onInvited?.();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to send invitation");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Invite someone to collaborate on "{project?.name}"
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleInvite} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
            <p>The invited person will:</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-500">
              <li>Receive an email invitation to join</li>
              <li>Get access to this project</li>
              <li>Be able to view and work on tasks</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Send Invite
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}