import { useState } from "react";
import { Users, Plus, X, Mail, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CollaborationTools() {
  const [inviteModal, setInviteModal] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [collaborators, setCollaborators] = useState([]);

  const handleInvite = () => {
    if (!email.trim()) return;
    setCollaborators([...collaborators, { email, role, status: "pending" }]);
    setEmail("");
    setInviteModal(false);
  };

  const removeCollaborator = (idx) => {
    setCollaborators(collaborators.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#e8f4ff]">Collaboration Tools</h2>
            <p className="text-xs text-blue-400/50">Invite team members and manage permissions</p>
          </div>
        </div>
        <button
          onClick={() => setInviteModal(true)}
          className="bg-[#1e78ff] hover:bg-[#1e78ff]/90 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Invite Team Member
        </button>
      </div>

      {/* Invite modal */}
      <AnimatePresence>
        {inviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9 }}
              className="bg-[#060d18] border border-blue-900/40 rounded-xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-[#e8f4ff] mb-4">Invite Team Member</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-blue-400/60 uppercase block mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-[#0a1525] border border-blue-900/30 rounded-lg p-2.5 text-sm text-[#c8dff5] placeholder-blue-400/20 outline-none focus:border-[#1e78ff]/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-blue-400/60 uppercase block mb-2">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-[#0a1525] border border-blue-900/30 rounded-lg p-2.5 text-sm text-[#c8dff5] outline-none focus:border-[#1e78ff]/50"
                  >
                    <option value="viewer">Viewer (Read only)</option>
                    <option value="commenter">Commenter (View & comment)</option>
                    <option value="editor">Editor (Full access)</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setInviteModal(false)}
                    className="flex-1 bg-blue-900/20 hover:bg-blue-900/30 text-blue-300 font-bold py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInvite}
                    disabled={!email.trim()}
                    className="flex-1 bg-[#1e78ff] hover:bg-[#1e78ff]/90 disabled:opacity-50 text-white font-bold py-2 rounded-lg transition-colors"
                  >
                    Send Invite
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collaborators list */}
      {collaborators.length > 0 ? (
        <div className="bg-[#0a1525] border border-blue-900/30 rounded-xl overflow-hidden">
          <div className="divide-y divide-blue-900/20">
            {collaborators.map((collab, idx) => (
              <div key={idx} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1e78ff] to-[#a855f7] flex items-center justify-center text-white text-sm font-bold">
                    {collab.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#e8f4ff]">{collab.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-blue-400/60 capitalize">{collab.role}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        collab.status === "pending" ? "bg-yellow-900/20 text-yellow-400" : "bg-green-900/20 text-green-400"
                      }`}>
                        {collab.status === "pending" ? "Pending" : "Active"}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => removeCollaborator(idx)} className="text-red-400/60 hover:text-red-400 p-2">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-[#0a1525] border border-blue-900/20 rounded-xl">
          <Users className="w-10 h-10 text-blue-400/20 mx-auto mb-2" />
          <p className="text-sm text-blue-400/50">No team members yet. Invite someone to collaborate!</p>
        </div>
      )}
    </div>
  );
}