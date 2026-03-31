import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const platformColors = {
  blog: "bg-blue-100 text-blue-700 dark:bg-blue-900/40",
  twitter: "bg-sky-100 text-sky-700 dark:bg-sky-900/40",
  instagram: "bg-pink-100 text-pink-700 dark:bg-pink-900/40",
  linkedin: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40",
  tiktok: "bg-black text-white",
  youtube: "bg-red-100 text-red-700 dark:bg-red-900/40",
};

export default function ContentCalendar({ blogPosts = [], socialPosts = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month");

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group content by date
  const contentByDate = {};
  [...blogPosts, ...socialPosts].forEach(post => {
    const dateKey = post.posted_date || post.created_date;
    if (dateKey) {
      const dateStr = format(new Date(dateKey), "yyyy-MM-dd");
      if (!contentByDate[dateStr]) contentByDate[dateStr] = [];
      contentByDate[dateStr].push({ ...post, type: post.platform ? "social" : "blog", platform: post.platform || "blog" });
    }
  });

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Schedule Content
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-0 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="p-4 text-center font-semibold text-slate-700 dark:text-slate-300">
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayContent = contentByDate[dateStr] || [];
            const isToday = isSameDay(day, new Date());

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`min-h-32 p-3 border-b border-r border-slate-200 dark:border-slate-700 ${
                  isToday ? "bg-indigo-50 dark:bg-indigo-900/20" : ""
                }`}
              >
                <div className={`text-sm font-semibold mb-2 ${isToday ? "text-indigo-600" : "text-slate-600 dark:text-slate-400"}`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayContent.map((post, i) => (
                    <div key={i} className={`text-xs px-2 py-1 rounded truncate font-medium cursor-pointer hover:shadow-md transition-all ${platformColors[post.platform]}`}>
                      {post.title || post.content_title}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(platformColors).map(([platform, color]) => (
          <div key={platform} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${color}`} />
            <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">{platform}</span>
          </div>
        ))}
      </div>
    </div>
  );
}