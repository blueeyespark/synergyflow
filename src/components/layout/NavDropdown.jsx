import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function NavDropdown({ group, currentPageName, isAdmin }) {
  const [open, setOpen] = useState(false);
  
  // Handle both flat and sectioned structures
  const hasSections = group.children?.[0]?.section;
  let isActive = false;
  let flatChildren = [];
  
  if (hasSections) {
    // New sectioned format
    group.children.forEach(section => {
      section.items.forEach(item => {
        if (!item.adminOnly || isAdmin) {
          flatChildren.push(item);
          if (item.page === currentPageName) isActive = true;
        }
      });
    });
  } else {
    // Old flat format
    flatChildren = group.children?.filter(c => !c.adminOnly || isAdmin) || [];
    isActive = flatChildren.some(c => c.page === currentPageName);
  }

  if (flatChildren.length === 0) return null;

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
        }`}
      >
        <group.icon className="w-4 h-4" />
        {group.label}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1.5 z-50 min-w-max"
          >
            {hasSections ? (
              // Sectioned layout
              group.children.map((section, idx) => {
                const visibleItems = section.items.filter(i => !i.adminOnly || isAdmin);
                if (visibleItems.length === 0) return null;
                return (
                  <div key={idx}>
                    <div className="px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {section.section}
                    </div>
                    {visibleItems.map(item => (
                      <Link
                        key={item.page}
                        to={createPageUrl(item.page)}
                        className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-colors whitespace-nowrap ${
                          currentPageName === item.page
                            ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 font-medium"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        }`}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        {item.name}
                      </Link>
                    ))}
                    {idx < group.children.length - 1 && <div className="border-t border-slate-100 dark:border-slate-700 my-1" />}
                  </div>
                );
              })
            ) : (
              // Flat layout (legacy)
              flatChildren.map(item => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-colors whitespace-nowrap ${
                    currentPageName === item.page
                      ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 font-medium"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.name}
                </Link>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}