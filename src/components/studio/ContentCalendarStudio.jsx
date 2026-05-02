import { useState } from "react";
import { Calendar, Plus, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export default function ContentCalendarStudio() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState("month");

  const scheduledContent = [
    { id: 1, title: "Gaming Marathon Stream", date: "2026-05-05", type: "stream", status: "scheduled", time: "19:00" },
    { id: 2, title: "Community Q&A", date: "2026-05-08", type: "stream", status: "scheduled", time: "20:00" },
    { id: 3, title: "New Video Upload", date: "2026-05-10", type: "video", status: "draft", time: "14:00" },
    { id: 4, title: "Sponsorship Announcement", date: "2026-05-12", type: "post", status: "scheduled", time: "18:00" },
    { id: 5, title: "Collab Stream", date: "2026-05-15", type: "stream", status: "confirmed", time: "21:00" },
  ];

  const upcomingWeek = scheduledContent.filter(c => {
    const contentDate = new Date(c.date);
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return contentDate <= weekFromNow && contentDate >= new Date();
  });

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-[#e8f4ff] flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Content Calendar
        </h2>
        <button className="flex items-center gap-2 bg-[#1e78ff] hover:bg-[#3d8fff] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Schedule Content
        </button>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        {["week", "month"].map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              view === v
                ? "bg-[#1e78ff] text-white"
                : "bg-blue-900/20 text-blue-300 hover:bg-blue-900/40"
            }`}
          >
            {v === "week" ? "Week" : "Month"}
          </button>
        ))}
      </div>

      {/* Upcoming Week */}
      <section>
        <h3 className="text-sm font-bold text-[#e8f4ff] mb-3 uppercase tracking-widest">Next 7 Days</h3>
        <div className="space-y-2">
          {upcomingWeek.length > 0 ? (
            upcomingWeek.map(c => (
              <div key={c.id} className="flex items-start gap-3 p-3 bg-[#060d18] border border-blue-900/40 rounded-lg hover:border-[#1e78ff]/40 transition-colors cursor-pointer">
                <div className="flex-shrink-0 mt-0.5">
                  {c.status === "scheduled" && <Clock className="w-4 h-4 text-yellow-400" />}
                  {c.status === "confirmed" && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                  {c.status === "draft" && <AlertCircle className="w-4 h-4 text-orange-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#c8dff5]">{c.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-blue-400/60">
                    <span>{c.date}</span>
                    <span>•</span>
                    <span>{c.time}</span>
                    <span>•</span>
                    <span className="capitalize">{c.type}</span>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded flex-shrink-0 ${
                  c.status === "scheduled" ? "bg-yellow-500/20 text-yellow-400" :
                  c.status === "confirmed" ? "bg-green-500/20 text-green-400" :
                  "bg-orange-500/20 text-orange-400"
                }`}>
                  {c.status}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-blue-400/50 p-4 text-center">No content scheduled for next 7 days</p>
          )}
        </div>
      </section>

      {/* Full Calendar View */}
      <section>
        <h3 className="text-sm font-bold text-[#e8f4ff] mb-3 uppercase tracking-widest">Full Schedule</h3>
        <div className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4">
          <div className="space-y-3">
            {scheduledContent.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-[#0a1525] border border-blue-900/20 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#c8dff5]">{c.title}</p>
                  <p className="text-xs text-blue-400/60 mt-1">{c.date} • {c.time}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-blue-900/20 text-blue-300 capitalize">{c.type}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    c.status === "scheduled" ? "bg-yellow-500/20 text-yellow-400" :
                    c.status === "confirmed" ? "bg-green-500/20 text-green-400" :
                    "bg-orange-500/20 text-orange-400"
                  }`}>
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Status */}
      <section>
        <h3 className="text-sm font-bold text-[#e8f4ff] mb-3 uppercase tracking-widest">Calendar Sync</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: "Google Calendar", status: "synced" },
            { name: "Discord Events", status: "not_synced" },
          ].map((cal, i) => (
            <div key={i} className="p-3 bg-[#060d18] border border-blue-900/40 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#c8dff5]">{cal.name}</p>
                <button className={`text-xs font-bold px-2 py-1 rounded ${
                  cal.status === "synced"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-blue-500/20 text-blue-300 hover:bg-blue-500/40"
                }`}>
                  {cal.status === "synced" ? "✓ Synced" : "Connect"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}