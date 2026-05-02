import { useState } from "react";
import { motion } from "framer-motion";
import { Edit3, X } from "lucide-react";
import VideoUpload from "@/pages/VideoUpload";
import VideoEditorAdvanced from "./VideoEditorAdvanced";
import { Button } from "@/components/ui/button";

export default function ProductionHub() {
  const [editorOpen, setEditorOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black text-[#e8f4ff] mb-2">Upload & Process</h2>
        <p className="text-xs text-blue-400/40 mb-4">Upload your video to get started</p>
        <VideoUpload />
      </div>

      <Button onClick={() => setEditorOpen(true)} className="gap-2" size="lg">
        <Edit3 className="w-4 h-4" /> Open Advanced Editor
      </Button>

      {editorOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setEditorOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-background dark:bg-[#03080f] rounded-2xl border border-slate-200 dark:border-blue-900/40 w-full max-h-[95vh] overflow-y-auto relative"
          >
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-slate-200 dark:border-blue-900/40 bg-background dark:bg-[#03080f] z-10">
              <h2 className="text-lg font-black text-foreground dark:text-[#e8f4ff]">Advanced Editor</h2>
              <button
                onClick={() => setEditorOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <VideoEditorAdvanced />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}