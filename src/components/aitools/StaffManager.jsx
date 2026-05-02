import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Trash2, ShieldCheck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StaffManager({ currentUser }) {
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const qc = useQueryClient();

  const { data: staff = [] } = useQuery({
    queryKey: ["staff-access"],
    queryFn: () => base44.entities.StaffAccess.list(),
    enabled: currentUser?.role === "admin",
  });

  const addMutation = useMutation({
    mutationFn: () => base44.entities.StaffAccess.create({
      email: newEmail.trim().toLowerCase(),
      name: newName.trim(),
      approved_by: currentUser.email,
      is_active: true,
    }),
    onSuccess: () => { qc.invalidateQueries(["staff-access"]); setNewEmail(""); setNewName(""); },
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.StaffAccess.delete(id),
    onSuccess: () => qc.invalidateQueries(["staff-access"]),
  });

  if (currentUser?.role !== "admin") return null;

  return (
    <div className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-4 h-4 text-[#1e78ff]" />
        <h3 className="text-sm font-bold text-[#e8f4ff]">Approved Staff List</h3>
        <span className="text-xs text-blue-400/40 ml-auto">Only these emails can unlock AI Tools</span>
      </div>

      {/* Add new */}
      <div className="flex gap-2 mb-4">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Name (optional)"
          className="w-28 bg-[#0a1525] border border-blue-900/40 rounded-xl px-3 py-2 text-xs text-[#c8dff5] placeholder-blue-400/30 outline-none focus:border-[#1e78ff]/50"
        />
        <input
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && newEmail.includes("@") && addMutation.mutate()}
          placeholder="staff@email.com"
          className="flex-1 bg-[#0a1525] border border-blue-900/40 rounded-xl px-3 py-2 text-xs text-[#c8dff5] placeholder-blue-400/30 outline-none focus:border-[#1e78ff]/50"
        />
        <Button
          size="sm"
          onClick={() => addMutation.mutate()}
          disabled={!newEmail.includes("@") || addMutation.isPending}
          className="gap-1 text-xs"
        >
          <UserPlus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>

      {/* Staff list */}
      {staff.length === 0 ? (
        <p className="text-xs text-blue-400/30 text-center py-4">No approved staff yet. Add emails above.</p>
      ) : (
        <div className="space-y-2">
          {staff.map(s => (
            <div key={s.id} className="flex items-center gap-3 bg-[#0a1525] border border-blue-900/30 rounded-xl px-3 py-2">
              <Mail className="w-3.5 h-3.5 text-blue-400/40 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                {s.name && <p className="text-xs font-semibold text-[#c8dff5]">{s.name}</p>}
                <p className="text-xs text-blue-400/50 truncate">{s.email}</p>
              </div>
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.is_active ? "bg-green-400" : "bg-red-400"}`} />
              <button
                onClick={() => removeMutation.mutate(s.id)}
                className="text-blue-400/30 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}