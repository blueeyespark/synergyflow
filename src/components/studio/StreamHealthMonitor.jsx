import { useState } from "react";
import { Activity, TrendingDown, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function StreamHealthMonitor() {
  const healthData = [
    { time: "8:00", bitrate: 5200, latency: 45, uptime: 99.8 },
    { time: "8:15", bitrate: 5100, latency: 48, uptime: 99.8 },
    { time: "8:30", bitrate: 4900, latency: 52, uptime: 99.5 },
    { time: "8:45", bitrate: 5300, latency: 43, uptime: 99.7 },
    { time: "9:00", bitrate: 5500, latency: 41, uptime: 99.9 },
  ];

  const metrics = [
    { label: "Stream Uptime", value: "99.7%", status: "good", icon: CheckCircle },
    { label: "Bitrate Health", value: "5.2 Mbps", status: "good", icon: TrendingUp },
    { label: "Avg Latency", value: "46ms", status: "good", icon: Activity },
    { label: "Network Issues", value: "0 detected", status: "good", icon: CheckCircle },
  ];

  const issues = [
    { type: "bitrate_drop", message: "Bitrate dropped 8% at 8:30", severity: "warning", time: "2 min ago" },
    { type: "high_latency", message: "Latency spike to 52ms", severity: "warning", time: "5 min ago" },
  ];

  return (
    <div className="space-y-6">
      {/* Stream Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${m.status === "good" ? "text-green-400" : "text-yellow-400"}`} />
                <span className="text-xs text-blue-400/60">{m.label}</span>
              </div>
              <p className="text-2xl font-black text-[#e8f4ff]">{m.value}</p>
            </div>
          );
        })}
      </div>

      {/* Bitrate Performance Chart */}
      <section className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4">
        <h3 className="text-sm font-bold text-[#e8f4ff] mb-3">Bitrate Over Time</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={healthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a3a60" />
            <XAxis dataKey="time" stroke="#4a7ea0" />
            <YAxis stroke="#4a7ea0" />
            <Tooltip contentStyle={{ background: "#0d1820", border: "1px solid #1a3a60" }} />
            <Line type="monotone" dataKey="bitrate" stroke="#1e78ff" dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* Current Issues */}
      <section>
        <h3 className="text-sm font-bold text-[#e8f4ff] mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          Recent Issues
        </h3>
        <div className="space-y-2">
          {issues.length > 0 ? (
            issues.map((issue, i) => (
              <div key={i} className={`p-3 rounded-lg border flex items-start justify-between ${
                issue.severity === "warning"
                  ? "bg-yellow-500/10 border-yellow-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}>
                <div>
                  <p className={`text-sm font-semibold ${
                    issue.severity === "warning" ? "text-yellow-300" : "text-red-300"
                  }`}>
                    {issue.message}
                  </p>
                  <p className="text-xs text-blue-400/60 mt-1">{issue.time}</p>
                </div>
                <button className="text-xs text-blue-300 hover:text-blue-200 font-semibold">
                  Dismiss
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-green-400 p-3 text-center bg-green-500/10 border border-green-500/30 rounded-lg">
              ✓ No issues detected
            </p>
          )}
        </div>
      </section>

      {/* Encoder Performance */}
      <section>
        <h3 className="text-sm font-bold text-[#e8f4ff] mb-3">Encoder Status</h3>
        <div className="space-y-2">
          {[
            { name: "CPU Usage", value: "35%", status: "good" },
            { name: "GPU Usage", value: "45%", status: "good" },
            { name: "Memory", value: "2.8 GB / 8 GB", status: "good" },
            { name: "Disk I/O", value: "12%", status: "good" },
          ].map((metric, i) => (
            <div key={i} className="p-3 bg-[#0a1525] border border-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-blue-400/60 font-semibold">{metric.name}</p>
                <p className="text-sm font-bold text-[#c8dff5]">{metric.value}</p>
              </div>
              <div className="h-1.5 bg-blue-900/20 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-400 to-blue-400" style={{ width: metric.value.split("%")[0] + "%" }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stream Settings Recommendations */}
      <section>
        <h3 className="text-sm font-bold text-[#e8f4ff] mb-3">Settings Optimization</h3>
        <div className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4">
          <div className="space-y-3">
            {[
              { rec: "Reduce bitrate by 500 kbps if frequent drops occur", priority: "medium" },
              { rec: "Enable hardware acceleration for better CPU performance", priority: "low" },
              { rec: "Monitor latency — currently optimal at 46ms", priority: "low" },
            ].map((r, i) => (
              <div key={i} className="flex gap-3 p-2 bg-[#0a1525] rounded-lg">
                <span className={`text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 ${
                  r.priority === "high" ? "bg-red-500/20 text-red-400" :
                  r.priority === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-blue-500/20 text-blue-400"
                }`}>
                  {r.priority}
                </span>
                <p className="text-xs text-blue-400/80">{r.rec}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}