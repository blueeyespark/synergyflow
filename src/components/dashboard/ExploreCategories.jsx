import { motion } from "framer-motion";
import { Gamepad2, Music, Tv, Radio, BookOpen, Trophy, Palette, Zap } from "lucide-react";

const CATEGORIES = [
  { label: "Gaming", icon: Gamepad2, color: "from-purple-500 to-indigo-600" },
  { label: "Music", icon: Music, color: "from-pink-500 to-rose-600" },
  { label: "Movies & TV", icon: Tv, color: "from-red-500 to-orange-600" },
  { label: "Live", icon: Radio, color: "from-red-600 to-pink-600" },
  { label: "Education", icon: BookOpen, color: "from-blue-500 to-cyan-600" },
  { label: "Sports", icon: Trophy, color: "from-amber-500 to-orange-600" },
  { label: "Art & Design", icon: Palette, color: "from-indigo-500 to-purple-600" },
  { label: "Trending", icon: Zap, color: "from-yellow-500 to-orange-600" },
];

export default function ExploreCategories({ onCategorySelect }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Explore Categories</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {CATEGORIES.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <motion.button
              key={cat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onCategorySelect?.(cat.label)}
              className="group relative h-24 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-90 group-hover:opacity-100 transition-opacity`} />
              <div className="relative h-full flex flex-col items-center justify-center gap-2">
                <Icon className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                <p className="text-white text-xs font-bold text-center px-1 line-clamp-2">{cat.label}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}