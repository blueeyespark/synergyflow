import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bot, Send, Loader2, CheckCircle, Copy, ExternalLink, Zap, MessageSquare, Hash, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const COMMANDS = [
  { cmd: "!tasks", desc: "List your open tasks" },
  { cmd: "!overdue", desc: "Show overdue tasks" },
  { cmd: "!projects", desc: "List active projects" },
  { cmd: "!done [task name]", desc: "Mark a task complete" },
  { cmd: "!ai [question]", desc: "Ask Planify AI anything" },
  { cmd: "!summary", desc: "Project health summary" },
];

export default function DiscordBot() {
  const [botToken, setBotToken] = useState(() => localStorage.getItem('discord_bot_token') || '');
  const [channelId, setChannelId] = useState(() => localStorage.getItem('discord_channel_id') || '');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const { data: tasks = [] } = useQuery({ queryKey: ['all-tasks'], queryFn: () => base44.entities.Task.list() });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list() });

  useEffect(() => {
    if (botToken) localStorage.setItem('discord_bot_token', botToken);
    if (channelId) localStorage.setItem('discord_channel_id', channelId);
  }, [botToken, channelId]);

  const sendDiscordMessage = async (content) => {
    if (!botToken || !channelId) {
      toast.error('Enter your bot token and channel ID first');
      return false;
    }
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bot ${botToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    return res.ok;
  };

  const testConnection = async () => {
    setSending(true);
    setTestResult(null);
    const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length;
    const active = projects.filter(p => p.status !== 'completed').length;
    const content = `🤖 **Planify Bot Connected!**\n\n📊 **Quick Summary:**\n• ${active} active projects\n• ${tasks.filter(t => t.status !== 'completed').length} open tasks\n• ${overdue} overdue tasks\n\nType \`!tasks\`, \`!projects\`, or \`!ai [question]\` to interact!\n\n✅ Connection verified at ${new Date().toLocaleTimeString()}`;
    const ok = await sendDiscordMessage(content);
    setSending(false);
    setTestResult(ok ? 'success' : 'error');
    if (ok) { setConnected(true); toast.success('Connected! Check your Discord channel.'); }
    else toast.error('Failed to send. Check your token and channel ID.');
  };

  const sendCustomMessage = async () => {
    if (!message.trim()) return;
    setSending(true);
    const ok = await sendDiscordMessage(message);
    setSending(false);
    if (ok) { toast.success('Message sent to Discord!'); setMessage(''); }
    else toast.error('Failed to send message.');
  };

  const sendTasksUpdate = async () => {
    setSending(true);
    const openTasks = tasks.filter(t => t.status !== 'completed').slice(0, 8);
    const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed');
    let content = `📋 **Open Tasks (${openTasks.length})**\n`;
    openTasks.forEach(t => {
      const overdue = t.due_date && new Date(t.due_date) < new Date();
      content += `• ${overdue ? '🔴' : '⚪'} ${t.title}${t.due_date ? ` _(due ${t.due_date})_` : ''}\n`;
    });
    if (overdueTasks.length > 0) content += `\n⚠️ **${overdueTasks.length} task(s) overdue!**`;
    const ok = await sendDiscordMessage(content);
    setSending(false);
    if (ok) toast.success('Tasks sent to Discord!');
  };

  const sendAIUpdate = async () => {
    setSending(true);
    const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length;
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Planify AI posting a Discord update. Context: ${projects.filter(p => p.status !== 'completed').length} active projects, ${tasks.filter(t => t.status !== 'completed').length} open tasks, ${overdue} overdue. Write a short, helpful Discord-formatted team update (max 150 words). Use emojis. Start with "📊 **Daily Standup Update**".`,
    });
    const msg = typeof result === 'string' ? result : (result?.response || '📊 All systems operational!');
    const ok = await sendDiscordMessage(msg);
    setSending(false);
    if (ok) toast.success('AI standup sent to Discord!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-900 dark:to-indigo-950/20">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#5865F2] rounded-2xl flex items-center justify-center shadow-lg">
            <Bot className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Discord Integration</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Connect Planify to Discord — send task updates, AI summaries, and more</p>
          {connected && <Badge className="mt-2 bg-green-100 text-green-700">🟢 Connected</Badge>}
        </motion.div>

        {/* Setup */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm mb-5">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#5865F2]" /> Bot Setup
          </h2>
          <div className="space-y-3">
            <div>
              <Label>Discord Bot Token</Label>
              <Input type="password" placeholder="MTxxxxxxxx.xxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={botToken} onChange={e => setBotToken(e.target.value)} />
              <p className="text-xs text-slate-400 mt-1">Get from <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-[#5865F2] hover:underline">Discord Developer Portal</a> → Your App → Bot → Token</p>
            </div>
            <div>
              <Label>Channel ID</Label>
              <Input placeholder="1234567890123456789" value={channelId} onChange={e => setChannelId(e.target.value)} />
              <p className="text-xs text-slate-400 mt-1">Right-click a channel in Discord → Copy Channel ID (enable Developer Mode in settings)</p>
            </div>
            <Button onClick={testConnection} disabled={!botToken || !channelId || sending} className="bg-[#5865F2] hover:bg-[#4752C4]">
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Test Connection
            </Button>
            {testResult === 'success' && <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Connected successfully!</p>}
            {testResult === 'error' && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Failed. Check token & channel ID.</p>}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm mb-5">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> Quick Actions
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Button variant="outline" onClick={sendTasksUpdate} disabled={sending || !botToken || !channelId}>
              <Hash className="w-4 h-4 mr-2 text-blue-500" /> Send Tasks List
            </Button>
            <Button variant="outline" onClick={sendAIUpdate} disabled={sending || !botToken || !channelId}>
              <Bot className="w-4 h-4 mr-2 text-purple-500" /> Send AI Standup
            </Button>
          </div>
        </div>

        {/* Custom Message */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm mb-5">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-green-500" /> Send Custom Message
          </h2>
          <Textarea placeholder="Type a message to send to Discord... (supports Discord markdown)" value={message} onChange={e => setMessage(e.target.value)} rows={3} className="mb-3" />
          <Button onClick={sendCustomMessage} disabled={!message.trim() || sending || !botToken || !channelId} className="bg-[#5865F2] hover:bg-[#4752C4]">
            {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Send to Discord
          </Button>
        </div>

        {/* Bot Commands Reference */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">📖 Bot Commands Reference</h2>
          <div className="space-y-2">
            {COMMANDS.map(c => (
              <div key={c.cmd} className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <code className="text-xs font-mono bg-[#5865F2]/10 text-[#5865F2] px-2 py-0.5 rounded">{c.cmd}</code>
                <span className="text-sm text-slate-600 dark:text-slate-400">{c.desc}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
            <p className="text-xs text-amber-700 dark:text-amber-400">💡 <strong>Note:</strong> These commands require setting up a Discord bot with a message listener (webhook or polling). Use the token above to configure your bot in the Discord Developer Portal.</p>
          </div>
        </div>
      </div>
    </div>
  );
}