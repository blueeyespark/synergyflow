import { useState } from "react";
import { Radio, Wifi, Settings, Copy, Eye, Users, AlertCircle } from "lucide-react";

export default function StreamingTechnical() {
  const [copied, setCopied] = useState(null);

  const rtmpUrl = "rtmp://live.vstream.app/live";
  const streamKey = "sk_" + Math.random().toString(36).slice(2, 15);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const streamSettings = [
    { label: "Bitrate", value: "4500-6000 kbps", desc: "1080p @ 60fps recommended" },
    { label: "Resolution", value: "1920x1080", desc: "16:9 aspect ratio" },
    { label: "Framerate", value: "60 fps", desc: "Smooth gameplay" },
    { label: "Codec", value: "H.264", desc: "Maximum compatibility" },
    { label: "Audio", value: "128 kbps AAC", desc: "44.1kHz sample rate" },
    { label: "Encoder", value: "NVIDIA / AMD GPU", desc: "CPU: H.264 fallback" },
  ];

  const networkChecks = [
    { label: "Upload Speed", value: "50+ Mbps", status: "good" },
    { label: "Latency", value: "< 50ms", status: "good" },
    { label: "Packet Loss", value: "< 1%", status: "good" },
    { label: "ISP Stability", value: "Check now", status: "warning" },
  ];

  return (
    <div className="space-y-6">
      {/* RTMP Configuration */}
      <section>
        <h2 className="text-xl font-black text-[#e8f4ff] mb-4 flex items-center gap-2">
          <Radio className="w-5 h-5 text-red-400" />
          RTMP Configuration
        </h2>
        <div className="space-y-3">
          {[
            { label: "RTMP URL", value: rtmpUrl, id: "rtmp" },
            { label: "Stream Key", value: streamKey, id: "key" },
          ].map((item) => (
            <div key={item.id} className="bg-[#060d18] border border-blue-900/40 rounded-xl p-4">
              <p className="text-xs text-blue-400/60 mb-2 uppercase font-semibold">{item.label}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-[#0a1525] border border-blue-900/20 rounded-lg px-3 py-2 text-sm text-[#c8dff5] font-mono break-all">
                  {item.value}
                </code>
                <button
                  onClick={() => copyToClipboard(item.value, item.id)}
                  className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-[#1e78ff] hover:bg-[#3d8fff] rounded-lg transition-colors"
                >
                  <Copy className={`w-4 h-4 text-white ${copied === item.id ? "hidden" : ""}`} />
                  {copied === item.id && <span className="text-white text-xs font-bold">✓</span>}
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-blue-400/50 mt-4 p-3 bg-blue-900/10 border border-blue-900/20 rounded-lg">
          ⚠️ Keep your stream key private. Rotate it if exposed.
        </p>
      </section>

      {/* Recommended Settings */}
      <section>
        <h2 className="text-xl font-black text-[#e8f4ff] mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-400" />
          Recommended Settings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {streamSettings.map((s, i) => (
            <div key={i} className="bg-[#060d18] border border-blue-900/40 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-blue-400/60 uppercase">{s.label}</p>
              </div>
              <p className="text-sm font-bold text-[#e8f4ff]">{s.value}</p>
              <p className="text-xs text-blue-400/50 mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Network Requirements */}
      <section>
        <h2 className="text-xl font-black text-[#e8f4ff] mb-4 flex items-center gap-2">
          <Wifi className="w-5 h-5 text-green-400" />
          Network Requirements
        </h2>
        <div className="space-y-2">
          {networkChecks.map((check, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-[#060d18] border border-blue-900/40 rounded-lg">
              <div>
                <p className="text-sm font-semibold text-[#c8dff5]">{check.label}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${check.status === "good" ? "text-green-400" : "text-yellow-400"}`}>
                  {check.value}
                </span>
                {check.status === "good" && <span className="w-2 h-2 rounded-full bg-green-400" />}
                {check.status === "warning" && <AlertCircle className="w-4 h-4 text-yellow-400" />}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Encoder Guides */}
      <section>
        <h2 className="text-xl font-black text-[#e8f4ff] mb-4">Encoder Setup Guides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: "OBS Studio", icon: "🎥", desc: "Open-source streaming software" },
            { name: "Streamlabs OBS", icon: "⚡", desc: "Feature-rich OBS fork" },
            { name: "xSplit", icon: "🎬", desc: "Pro streaming software" },
            { name: "NVIDIA Broadcast", icon: "🖥️", desc: "GPU-powered streaming" },
          ].map((guide, i) => (
            <div key={i} className="p-4 bg-[#060d18] border border-blue-900/40 rounded-xl cursor-pointer hover:border-[#1e78ff]/40 transition-colors">
              <p className="text-xl mb-2">{guide.icon}</p>
              <p className="text-sm font-bold text-[#e8f4ff]">{guide.name}</p>
              <p className="text-xs text-blue-400/60 mt-1">{guide.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}