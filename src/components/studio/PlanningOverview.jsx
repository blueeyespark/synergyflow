import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderKanban, CheckSquare, Clock, AlertTriangle, Calendar, Users, Zap, BarChart3, Plus, Edit, Trash2, Copy } from "lucide-react";
import { isPast, isToday, isBefore, addDays, format, subDays, startOfDay } from "date-fns";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import StatsCard from "@/components/dashboard/StatsCard";
import UpcomingTasks from "@/components/dashboard/UpcomingTasks";
import ProjectsOverview from "@/components/dashboard/ProjectsOverview";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];

export default function PlanningOverview() {
  const [user, setUser] = useState(null);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [meetingForm, setMeetingForm] = useState({ title: "", description: "", date: "", start_time: "", end_time: "", attendees: [] });
  const [attendeeInput, setAttendeeInput] = useState("");
  const [timeRange, setTimeRange] = useState("week");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", user?.email],
    queryFn: () => base44.entities.Project.list("-created_date"),
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", user?.email],
    queryFn: () => base44.entities.Task.list("-created_date"),
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000,
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ["meetings", user?.email],
    queryFn: () => base44.entities.Meeting?.list?.("-date") || [],
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["templates", user?.email],
    queryFn: () => base44.entities.ContentTemplate?.list?.("-created_date") || [],
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000,
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ["schedules", user?.email],
    queryFn: () => base44.entities.Schedule?.list?.("-scheduled_date") || [],
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000,
  });

  const { data: timeEntries = [] } = useQuery({
    queryKey: ["time-entries", user?.email],
    queryFn: () => base44.entities.TimeEntry?.filter?.({ user_email: user?.email }, "-start_time") || [],
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
  });

  const meetingMutation = useMutation({
    mutationFn: (data) => editingMeeting ? base44.entities.Meeting.update(editingMeeting.id, data) : base44.entities.Meeting.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      setShowMeetingForm(false);
      setEditingMeeting(null);
      setMeetingForm({ title: "", description: "", date: "", start_time: "", end_time: "", attendees: [] });
      toast.success(editingMeeting ? "Meeting updated" : "Meeting scheduled");
    },
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: (id) => base44.entities.Meeting.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Meeting deleted");
    },
  });

  const myProjects = useMemo(() => projects.filter(
    (p) => p.owner_email === user?.email || p.team_members?.includes(user?.email)
  ), [projects, user?.email]);

  const myTasks = useMemo(() => tasks.filter((t) => {
    const project = myProjects.find((p) => p.id === t.project_id);
    return project && (t.assigned_to === user?.email || !t.assigned_to);
  }), [tasks, myProjects, user?.email]);

  const myMeetings = useMemo(() => meetings.filter((m) => m.attendees?.includes(user?.email) || m.organizer_email === user?.email), [meetings, user?.email]);

  const activeProjects = myProjects.filter((p) => p.status !== "completed").length;
  const completedTasks = myTasks.filter((t) => t.status === "completed").length;
  const overdueTasks = myTasks.filter(
    (t) =>
      t.due_date &&
      isPast(new Date(t.due_date + "T12:00:00")) &&
      !isToday(new Date(t.due_date + "T12:00:00")) &&
      t.status !== "completed"
  ).length;
  const upcomingDeadlines = myTasks.filter(
    (t) =>
      t.due_date &&
      t.status !== "completed" &&
      isBefore(new Date(t.due_date + "T12:00:00"), addDays(new Date(), 7))
  ).length;

  const urgentTasks = myTasks
    .filter((t) => t.status !== "completed")
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date) - new Date(b.due_date);
    })
    .slice(0, 5);

  const upcomingMeetings = useMemo(() => 
    myMeetings
      .filter((m) => m.date && new Date(m.date) > new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5),
    [myMeetings]
  );

  const filteredTimeEntries = useMemo(() => {
    const days = timeRange === "week" ? 7 : timeRange === "month" ? 30 : 1;
    const cutoff = subDays(new Date(), days);
    return timeEntries.filter(e => new Date(e.start_time || e.date) >= cutoff);
  }, [timeEntries, timeRange]);

  const totalTimeLogged = useMemo(() => 
    filteredTimeEntries.reduce((sum, t) => sum + (t.duration_minutes || t.duration_seconds ? (t.duration_seconds / 60) : 0), 0),
    [filteredTimeEntries]
  );

  const projectTimeData = useMemo(() => {
    const grouped = {};
    filteredTimeEntries.forEach((e) => {
      const task = tasks.find((t) => t.id === e.task_id);
      const proj = projects.find((p) => p.id === task?.project_id);
      const projName = proj?.name || "Unassigned";
      grouped[projName] = (grouped[projName] || 0) + (e.duration_minutes || e.duration_seconds ? (e.duration_seconds / 3600) : 0);
    });
    return Object.entries(grouped).map(([name, hours]) => ({ name, hours: parseFloat(hours.toFixed(2)) })).sort((a, b) => b.hours - a.hours);
  }, [filteredTimeEntries, tasks, projects]);

  const handleAddMeeting = () => {
    if (!meetingForm.title || !meetingForm.date) return;
    meetingMutation.mutate(meetingForm);
  };

  const handleEditMeeting = (meeting) => {
    setEditingMeeting(meeting);
    setMeetingForm({
      title: meeting.title || "",
      description: meeting.description || "",
      date: meeting.date || "",
      start_time: meeting.start_time || "",
      end_time: meeting.end_time || "",
      attendees: meeting.attendees || [],
    });
    setShowMeetingForm(true);
  };

  const addAttendee = () => {
    if (attendeeInput && !meetingForm.attendees.includes(attendeeInput)) {
      setMeetingForm({ ...meetingForm, attendees: [...meetingForm.attendees, attendeeInput] });
      setAttendeeInput("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Master Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatsCard title="Active Projects" value={activeProjects} icon={FolderKanban} color="bg-indigo-500" />
        <StatsCard title="Tasks Completed" value={completedTasks} icon={CheckSquare} color="bg-green-500" subtitle={`of ${myTasks.length}`} />
        <StatsCard title="Due This Week" value={upcomingDeadlines} icon={Clock} color="bg-amber-500" />
        <StatsCard title="Overdue" value={overdueTasks} icon={AlertTriangle} color="bg-red-500" />
        <StatsCard title="Meetings" value={myMeetings.length} icon={Users} color="bg-blue-500" />
      </div>

      {overdueTasks > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">
            <span className="font-semibold">{overdueTasks} overdue task{overdueTasks > 1 ? "s" : ""}</span> need your attention
          </p>
        </div>
      )}

      {/* Core Planning Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-slate-100 dark:border-zinc-700 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" /> Upcoming Tasks
          </h3>
          {urgentTasks.length > 0 ? (
            <UpcomingTasks tasks={urgentTasks} onTaskClick={() => {}} />
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No upcoming tasks</p>
          )}
        </div>

        {/* Projects Overview */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-slate-100 dark:border-zinc-700 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-indigo-500" /> Projects
          </h3>
          {myProjects.length > 0 ? (
            <ProjectsOverview projects={myProjects} tasks={tasks} />
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No projects created</p>
          )}
        </div>
      </div>

      {/* Meetings + Time Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-500" /> Meetings
            </h3>
            <Button size="sm" onClick={() => { setEditingMeeting(null); setShowMeetingForm(true); }}>
              <Plus className="w-3 h-3" /> Schedule
            </Button>
          </div>
          {upcomingMeetings.length > 0 ? (
            <div className="space-y-2.5">
              {upcomingMeetings.map((m) => (
                <div key={m.id} className="p-3 border border-slate-200 dark:border-zinc-700 rounded-lg flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{m.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{format(new Date(m.date), "MMM d, h:mm a")}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">⋯</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleEditMeeting(m)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteMeetingMutation.mutate(m.id)} className="text-red-600">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No upcoming meetings</p>
          )}
        </Card>

        {/* Time Tracking Summary */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-500" /> Time Tracking
            </h3>
            <div className="flex gap-1">
              {["week", "month"].map((r) => (
                <Button key={r} size="sm" variant={timeRange === r ? "default" : "outline"} onClick={() => setTimeRange(r)}>
                  {r}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Hours</p>
              <p className="text-3xl font-black text-slate-800 dark:text-white">{totalTimeLogged.toFixed(1)}h</p>
            </div>
            {projectTimeData.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Top Projects</p>
                {projectTimeData.slice(0, 3).map((p) => (
                  <div key={p.name} className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">{p.name}</span>
                    <span className="font-bold text-slate-800 dark:text-white">{p.hours}h</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Content Templates */}
      <Card className="p-5">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" /> Content Templates ({templates.length})
        </h3>
        {templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.slice(0, 6).map((t) => (
              <div key={t.id} className="p-3 border border-slate-200 dark:border-zinc-700 rounded-lg">
                <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{t.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.type}</p>
                {t.usage_count && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Used {t.usage_count} times</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No templates created</p>
        )}
      </Card>

      {/* Scheduled Content */}
      <Card className="p-5">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-green-500" /> Scheduled Content ({schedules.length})
        </h3>
        {schedules.filter((s) => s.status === "scheduled").length > 0 ? (
          <div className="space-y-2.5">
            {schedules.filter((s) => s.status === "scheduled").slice(0, 5).map((s) => (
              <div key={s.id} className="p-3 border border-slate-200 dark:border-zinc-700 rounded-lg">
                <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{s.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{format(new Date(s.scheduled_date), "MMM d, h:mm a")}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No scheduled content</p>
        )}
      </Card>

      {/* Activity Feed */}
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-slate-100 dark:border-zinc-700 p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-green-500" /> Activity Feed
        </h3>
        <ActivityFeed projects={myProjects} userEmail={user?.email} />
      </div>

      {/* Meeting Dialog */}
      <Dialog open={showMeetingForm} onOpenChange={setShowMeetingForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMeeting ? "Edit Meeting" : "Schedule Meeting"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Title</Label>
              <Input value={meetingForm.title} onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })} placeholder="Meeting title" />
            </div>
            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    {meetingForm.date ? format(new Date(meetingForm.date), "MMM d, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent mode="single" selected={meetingForm.date ? new Date(meetingForm.date) : undefined} onSelect={(d) => setMeetingForm({ ...meetingForm, date: d?.toISOString().split("T")[0] || "" })} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Start Time</Label>
                <Input type="time" value={meetingForm.start_time} onChange={(e) => setMeetingForm({ ...meetingForm, start_time: e.target.value })} />
              </div>
              <div>
                <Label>End Time</Label>
                <Input type="time" value={meetingForm.end_time} onChange={(e) => setMeetingForm({ ...meetingForm, end_time: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Attendees</Label>
              <div className="flex gap-1">
                <Input value={attendeeInput} onChange={(e) => setAttendeeInput(e.target.value)} placeholder="Email" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAttendee())} />
                <Button size="sm" onClick={addAttendee}>Add</Button>
              </div>
              {meetingForm.attendees.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {meetingForm.attendees.map((a) => (
                    <Badge key={a} variant="secondary">
                      {a} <button onClick={() => setMeetingForm({ ...meetingForm, attendees: meetingForm.attendees.filter((x) => x !== a) })}>×</button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={handleAddMeeting} disabled={meetingMutation.isPending}>
              {meetingMutation.isPending ? "Saving..." : "Schedule"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}