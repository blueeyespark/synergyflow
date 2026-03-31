import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, Copy, Edit2, Trash2, Star, Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ContentTemplates() {
  const [view, setView] = useState("grid");
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["contentTemplates"],
    queryFn: () => base44.entities.ContentTemplate.list("-created_date"),
  });

  const duplicateMutation = useMutation({
    mutationFn: (template) => 
      base44.entities.ContentTemplate.create({
        ...template,
        title: `${template.title} (Copy)`,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contentTemplates"] });
      toast.success("Template duplicated!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ContentTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contentTemplates"] });
      toast.success("Template deleted");
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Content Templates</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setView(view === 'grid' ? 'list' : 'grid')}>
            {view === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Template
          </Button>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-600 dark:text-slate-400 mb-4">No templates yet</p>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Your First Template
          </Button>
        </div>
      ) : (
        <div className={view === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
          {templates.map((template, idx) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 dark:text-white">{template.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 capitalize">{template.type.replace(/_/g, ' ')}</p>
                </div>
                <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 px-2 py-1 rounded capitalize">
                  {template.platform}
                </span>
              </div>

              {template.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">{template.description}</p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400">{template.usage_count} uses</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => duplicateMutation.mutate(template)}
                    className="text-slate-600 dark:text-slate-400"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 dark:text-slate-400"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(template.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}