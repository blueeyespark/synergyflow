import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, FolderKanban, FolderOpen, Calendar, Trophy } from "lucide-react";

const items = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Projects", icon: FolderKanban, page: "Projects" },
  { name: "Planner", icon: FolderOpen, page: "Planner" },
  { name: "Calendar", icon: Calendar, page: "Calendar" },
  { name: "Leaderboard", icon: Trophy, page: "Leaderboard" },
];

export default function MobileNav({ currentPageName }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => {
          const isActive = currentPageName === item.page;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-0 ${
                isActive
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-slate-500"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-[10px] font-medium truncate">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}