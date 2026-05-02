import { useState } from "react";
import { motion } from "framer-motion";
import { Edit3, X } from "lucide-react";
import VideoUpload from "@/pages/VideoUpload";
import AdvancedVideoEditor from "./AdvancedVideoEditor";
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
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setEditorOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-7xl h-[90vh] relative flex items-center justify-center"
          >
            <div className="absolute top-2 right-2 z-20">
              <button
                onClick={() => setEditorOpen(false)}
                className="p-2 hover:bg-blue-900/40 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-blue-400" />
              </button>
            </div>
            <AdvancedVideoEditor />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}