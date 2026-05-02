import { useState } from "react";
import { Gift, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";

const TIERS = [
  { amount: 1, label: "$1", color: "#1e90ff" },
  { amount: 5, label: "$5", color: "#00bfff" },
  { amount: 10, label: "$10", color: "#32cd32" },
  { amount: 50, label: "$50", color: "#ff6347" },
  { amount: 100, label: "$100", color: "#ffd700" },
];

export default function SuperChatButton({ video, channel, user }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!user || !channel) return null;

  const handleSend = async () => {
    if (!selectedTier || !message.trim()) {
      setError("Please select a tier and add a message");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const tier = TIERS.find(t => t.amount === selectedTier);
      
      // Create super chat record
      const superChat = await base44.entities.SuperChat.create({
        channel_id: channel.id,
        video_id: video?.id,
        sender_email: user.email,
        sender_name: user.full_name || user.email,
        message: message.trim(),
        amount: selectedTier,
        tier: `$${selectedTier}`,
        color: tier.color,
        payment_status: "pending",
      });

      // Process payment
      const payment = await base44.functions.invoke("processPayment", {
        amount: selectedTier,
        currency: "USD",
        recipient: channel.creator_email,
        description: `Super Chat on ${channel.channel_name}`,
      });

      if (payment.data?.success) {
        // Update super chat to completed
        await base44.entities.SuperChat.update(superChat.id, {
          payment_status: "completed",
          transaction_id: payment.data.transaction_id,
        });
        
        setSuccess(true);
        setMessage("");
        setSelectedTier(null);
        setTimeout(() => {
          setShowModal(false);
          setSuccess(false);
        }, 2000);
      } else {
        setError("Payment failed. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white text-sm font-bold px-4 py-2 rounded-full transition-all"
      >
        <Gift className="w-4 h-4" /> Super Chat
      </button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Support {channel?.channel_name}</h3>

              {success && (
                <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg text-sm text-green-700 dark:text-green-300">
                  ✓ Super Chat sent! Thanks for supporting this creator.
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg flex gap-2 text-sm text-red-700 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="mb-5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Select Amount</p>
                <div className="grid grid-cols-5 gap-2">
                  {TIERS.map(tier => (
                    <button
                      key={tier.amount}
                      onClick={() => setSelectedTier(tier.amount)}
                      style={{ borderColor: tier.color }}
                      className={`py-2 px-2 rounded-lg text-sm font-bold transition-all border-2 ${
                        selectedTier === tier.amount
                          ? "text-white"
                          : "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700"
                      }`}
                      style={{
                        backgroundColor: selectedTier === tier.amount ? tier.color : undefined,
                        borderColor: tier.color,
                      }}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase block mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Write something nice..."
                  maxLength={200}
                  className="w-full h-20 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                />
                <p className="text-xs text-slate-400 mt-1">{message.length}/200</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={loading || !selectedTier}
                  className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-lg transition-colors"
                >
                  {loading ? "Processing..." : "Send Super Chat"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}