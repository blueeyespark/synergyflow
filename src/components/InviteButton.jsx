import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { UserPlus, X, Send, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function InviteButton() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleInvite = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setLoading(true);
    await base44.users.inviteUser(email.trim(), "user");
    setLoading(false);
    setSent(true);
    toast.success(`Invite sent to ${email.trim()}`);
    setTimeout(() => {
      setOpen(false);
      setEmail("");
      setSent(false);
    }, 1500);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="text-slate-400 hover:text-slate-600"
        title="Invite someone"
      >
        <UserPlus className="w-4 h-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite Someone</DialogTitle>
          </DialogHeader>
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
              <p className="text-sm text-slate-600">Invite sent successfully!</p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-slate-500">Enter their email address and they'll receive an invite to join Planify and collaborate with you.</p>
              <Input
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleInvite()}
                autoFocus
              />
              <Button
                className="w-full gap-2"
                onClick={handleInvite}
                disabled={loading || !email.trim()}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Invite
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}