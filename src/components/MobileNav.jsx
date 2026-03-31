import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, FolderKanban, FolderOpen, Calendar, Trophy, UserPlus } from "lucide-react";
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CheckCircle, Send } from "lucide-react";

const items = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Projects", icon: FolderKanban, page: "Projects" },
  { name: "Planner", icon: FolderOpen, page: "Planner" },
  { name: "Calendar", icon: Calendar, page: "Calendar" },
  { name: "Leaderboard", icon: Trophy, page: "Leaderboard" },
];

function InviteModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleInvite = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email");
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
      <button
        onClick={() => setOpen(true)}
        className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors text-slate-500"
        title="Invite someone"
      >
        <UserPlus className="w-5 h-5 flex-shrink-0" />
        <span className="text-[10px] font-medium">Invite</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite Someone</DialogTitle>
          </DialogHeader>
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
              <p className="text-sm text-slate-600">Invite sent!</p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
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

export default function MobileNav({ currentPageName }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => {
          const isActive = currentPageName === item.page;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-0 ${
                isActive
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-slate-500"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-[10px] font-medium truncate">{item.name}</span>
            </Link>
          );
        })}
        <InviteModal />
      </div>
    </nav>
  );
}