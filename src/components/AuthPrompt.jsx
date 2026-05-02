import { motion, AnimatePresence } from "framer-motion";
import { LogIn, X, UserPlus } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * A small overlay/banner that prompts unauthenticated users to sign in or sign up.
 * Usage: render when user is null and they try to do an action.
 * Pass onClose to dismiss it.
 */
export default function AuthPrompt({ action = "do that", onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose?.()}
      >
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="bg-[#060d18] border border-blue-900/40 rounded-2xl p-6 w-full max-w-sm shadow-2xl shadow-black/60 relative"
        >
          {onClose && (
            <button onClick={onClose} className="absolute top-3 right-3 text-blue-400/40 hover:text-blue-300">
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1e78ff] to-[#a855f7] mx-auto mb-4">
            <LogIn className="w-6 h-6 text-white" />
          </div>

          <h3 className="text-center text-lg font-black text-[#e8f4ff] mb-1">Sign in required</h3>
          <p className="text-center text-sm text-blue-400/60 mb-5">
            You need an account to {action}. It's free!
          </p>

          <div className="space-y-2">
            <button
              onClick={() => base44.auth.redirectToLogin(window.location.href)}
              className="w-full py-2.5 bg-[#1e78ff] hover:bg-[#3d8fff] text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
            <button
              onClick={() => base44.auth.redirectToLogin(window.location.href)}
              className="w-full py-2.5 bg-transparent border border-blue-900/40 hover:bg-blue-900/20 text-blue-300 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Create Account
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}