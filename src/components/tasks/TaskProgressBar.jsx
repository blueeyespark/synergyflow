import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const stages = [
  { id: "not_started", label: "Not Started", color: "bg-slate-300" },
  { id: "in_progress", label: "In Progress", color: "bg-blue-400" },
  { id: "testing", label: "Testing", color: "bg-amber-400" },
  { id: "completed", label: "Completed", color: "bg-green-500" }
];

export default function TaskProgressBar({ task, onProgressChange, onStageChange }) {
  const [isDragging, setIsDragging] = useState(false);
  
  const currentStage = stages.find(s => s.id === task.stage) || stages[0];
  const stageIndex = stages.findIndex(s => s.id === task.stage);
  const progress = ((stageIndex + 1) / stages.length) * 100;

  const handleStageClick = (stageId) => {
    if (onStageChange) onStageChange(stageId);
  };

  const handleProgressChange = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const stageIndex = Math.floor((percentage / 100) * stages.length);
    const stage = stages[Math.min(stageIndex, stages.length - 1)];
    if (onStageChange) onStageChange(stage.id);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">Progress</span>
        <span className="text-xs text-slate-500">{currentStage.label}</span>
      </div>
      
      {/* Draggable progress bar */}
      <motion.div
        onClick={handleProgressChange}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        className="relative h-2 bg-slate-200 rounded-full cursor-pointer overflow-hidden group"
      >
        <motion.div
          className={cn("h-full rounded-full transition-all", currentStage.color)}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-slate-400 rounded-full cursor-grab active:cursor-grabbing shadow-md group-hover:border-slate-600"
          animate={{ left: `calc(${progress}% - 8px)` }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.2 }}
        />
      </motion.div>

      {/* Stage buttons */}
      <div className="flex gap-1 flex-wrap pt-2">
        {stages.map((stage, idx) => (
          <motion.button
            key={stage.id}
            onClick={() => handleStageClick(stage.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex-1 min-w-20 px-2 py-1.5 rounded-md text-xs font-medium transition-all",
              task.stage === stage.id
                ? `${stage.color} text-white shadow-md`
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {stage.label.split(" ")[0]}
            {idx < stages.length - 1 && task.stage === stage.id && (
              <ChevronRight className="w-3 h-3 ml-1 inline" />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}