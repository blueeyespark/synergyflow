import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Play, Pause, Square, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function TimeTracker({ taskId, taskTitle }) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sessionStart, setSessionStart] = useState(null);
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      setElapsed(Date.now() - sessionStart);
    }, 100);
    
    return () => clearInterval(interval);
  }, [isRunning, sessionStart]);

  const createTimeEntryMutation = useMutation({
    mutationFn: (data) => base44.entities.TimeEntry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time_entries"] });
      toast.success("Time tracked successfully");
    },
  });

  const handleStart = () => {
    setSessionStart(Date.now());
    setElapsed(0);
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = async () => {
    setIsRunning(false);
    
    if (elapsed > 0) {
      const endTime = new Date(sessionStart + elapsed);
      
      createTimeEntryMutation.mutate({
        task_id: taskId,
        task_title: taskTitle,
        user_email: user?.email,
        start_time: new Date(sessionStart).toISOString(),
        end_time: endTime.toISOString(),
        duration_seconds: Math.floor(elapsed / 1000),
        is_billable: true,
      });
    }
    
    setSessionStart(null);
    setElapsed(0);
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Clock className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-xs text-slate-600 font-medium">Time Logged</p>
            <motion.p
              className="text-2xl font-bold text-blue-600 font-mono"
              key={elapsed}
            >
              {formatTime(elapsed)}
            </motion.p>
          </div>
        </div>

        <div className="flex gap-2">
          {!isRunning && (
            <Button
              size="sm"
              onClick={handleStart}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Play className="w-4 h-4" />
              Start
            </Button>
          )}
          
          {isRunning && (
            <>
              <Button
                size="sm"
                onClick={handlePause}
                variant="outline"
                className="gap-2"
              >
                <Pause className="w-4 h-4" />
                Pause
              </Button>
              <Button
                size="sm"
                onClick={handleStop}
                className="gap-2 bg-red-600 hover:bg-red-700"
              >
                <Square className="w-4 h-4" />
                Stop
              </Button>
            </>
          )}

          {!isRunning && elapsed > 0 && (
            <>
              <Button
                size="sm"
                onClick={handleStart}
                variant="outline"
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                Resume
              </Button>
              <Button
                size="sm"
                onClick={handleStop}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                <Clock className="w-4 h-4" />
                Save
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}