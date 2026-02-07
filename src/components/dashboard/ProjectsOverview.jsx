import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusColors = {
  planning: "bg-slate-500",
  in_progress: "bg-indigo-500",
  on_hold: "bg-amber-500",
  completed: "bg-green-500"
};

export default function ProjectsOverview({ projects, tasks }) {
  const getProjectProgress = (projectId) => {
    const projectTasks = tasks.filter(t => t.project_id === projectId);
    if (projectTasks.length === 0) return 0;
    const completed = projectTasks.filter(t => t.status === "completed").length;
    return Math.round((completed / projectTasks.length) * 100);
  };

  const getProjectTaskCount = (projectId) => {
    return tasks.filter(t => t.project_id === projectId).length;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Active Projects</h3>
          <p className="text-sm text-slate-500 mt-1">Your project overview</p>
        </div>
        <Link 
          to={createPageUrl("Projects")}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
        >
          View all
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="divide-y divide-slate-50">
        {projects.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-600 font-medium">No projects yet</p>
            <p className="text-sm text-slate-400 mt-1">Create your first project to get started</p>
          </div>
        ) : (
          projects.slice(0, 4).map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link 
                to={createPageUrl(`ProjectDetail?id=${project.id}`)}
                className="block p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-3 h-3 rounded-full mt-1.5"
                    style={{ backgroundColor: project.color || '#6366f1' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-slate-900 truncate">{project.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full text-white ${statusColors[project.status]}`}>
                        {project.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                        <span>{getProjectTaskCount(project.id)} tasks</span>
                        <span>{getProjectProgress(project.id)}%</span>
                      </div>
                      <Progress value={getProjectProgress(project.id)} className="h-1.5" />
                    </div>
                    {project.team_members?.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                        <Users className="w-3 h-3" />
                        <span>{project.team_members.length} members</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}