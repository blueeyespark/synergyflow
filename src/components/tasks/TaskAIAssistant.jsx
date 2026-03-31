import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, CheckCircle2, Lightbulb, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const priorityColors = {
  low: 'bg-blue-50 border-blue-200 text-blue-700',
  medium: 'bg-amber-50 border-amber-200 text-amber-700',
  high: 'bg-orange-50 border-orange-200 text-orange-700',
  urgent: 'bg-red-50 border-red-200 text-red-700'
};

const priorityIcons = {
  low: '📋',
  medium: '⚡',
  high: '🔥',
  urgent: '🚨'
};

export default function TaskAIAssistant({ taskTitle, taskDescription, projectId, onApplySuggestions }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [error, setError] = useState(null);

  const analyzeTask = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await base44.functions.invoke('analyzeTaskWithAI', {
        taskTitle,
        taskDescription,
        projectId
      });
      setSuggestions(response.data);
    } catch (err) {
      setError(err.message || 'Failed to analyze task');
      console.error('AI Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!suggestions ? (
        <Button
          onClick={analyzeTask}
          disabled={loading || !taskTitle}
          className="w-full gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {loading ? 'Analyzing...' : 'Get AI Suggestions'}
        </Button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5"
        >
          {/* Priority Suggestion */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-700">Suggested Priority</span>
            </div>
            <div className={`p-3 rounded-lg border ${priorityColors[suggestions.suggestedPriority]}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{priorityIcons[suggestions.suggestedPriority]}</span>
                <span className="font-semibold capitalize">{suggestions.suggestedPriority}</span>
              </div>
              <p className="text-xs opacity-75">{suggestions.priorityReason}</p>
            </div>
          </div>

          {/* Time Estimation */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-700">Estimated Time</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">{suggestions.estimatedDays}</div>
              <p className="text-xs text-slate-500">{suggestions.estimationReason}</p>
            </div>
          </div>

          {/* Subtasks */}
          {suggestions.subtasks?.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-semibold text-slate-700">Suggested Subtasks</span>
              </div>
              <div className="space-y-2">
                {suggestions.subtasks.map((subtask, idx) => (
                  <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg">
                    <p className="text-sm font-medium text-slate-900">{subtask.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{subtask.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {suggestions.tips && (
            <div className="flex gap-2 p-3 bg-white border border-slate-200 rounded-lg">
              <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700">{suggestions.tips}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-indigo-200">
            <Button
              onClick={() => {
                onApplySuggestions?.(suggestions);
                setSuggestions(null);
              }}
              size="sm"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              Apply Suggestions
            </Button>
            <Button
              onClick={() => setSuggestions(null)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Dismiss
            </Button>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}