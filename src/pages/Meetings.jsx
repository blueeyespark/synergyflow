import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, isToday, isFuture, isPast } from "date-fns";
import { 
  Plus, Calendar, Clock, Users, Video, MapPin, 
  MoreVertical, Edit, Trash2, CheckCircle, XCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function MeetingsPage() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [filter, setFilter] = useState("upcoming");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    start_time: "",
    end_time: "",
    attendees: [],
    location: "",
    meeting_link: "",
    status: "scheduled"
  });
  const [attendeeInput, setAttendeeInput] = useState("");
  
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: meetings = [] } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => base44.entities.Meeting.list('-date'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Meeting.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      setShowForm(false);
      resetForm();
      toast.success("Meeting scheduled");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Meeting.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      setShowForm(false);
      setEditingMeeting(null);
      resetForm();
      toast.success("Meeting updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Meeting.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success("Meeting deleted");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: "",
      start_time: "",
      end_time: "",
      attendees: [],
      location: "",
      meeting_link: "",
      status: "scheduled"
    });
    setAttendeeInput("");
  };

  const handleEdit = (meeting) => {
    setEditingMeeting(meeting);
    setFormData({
      title: meeting.title || "",
      description: meeting.description || "",
      date: meeting.date || "",
      start_time: meeting.start_time || "",
      end_time: meeting.end_time || "",
      attendees: meeting.attendees || [],
      location: meeting.location || "",
      meeting_link: meeting.meeting_link || "",
      status: meeting.status || "scheduled"
    });
    setShowForm(true);
  };

  const addAttendee = () => {
    if (attendeeInput && !formData.attendees.includes(attendeeInput)) {
      setFormData({ ...formData, attendees: [...formData.attendees, attendeeInput] });
      setAttendeeInput("");
    }
  };

  const removeAttendee = (email) => {
    setFormData({ ...formData, attendees: formData.attendees.filter(a => a !== email) });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingMeeting) {
      updateMutation.mutate({ id: editingMeeting.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredMeetings = meetings.filter(m => {
    const meetingDate = new Date(m.date);
    if (filter === "upcoming") return isFuture(meetingDate) || isToday(meetingDate);
    if (filter === "past") return isPast(meetingDate) && !isToday(meetingDate);
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Meetings</h1>
            <p className="text-slate-500 mt-1">Schedule and manage team meetings</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Schedule Meeting
          </Button>
        </motion.div>

        <Tabs value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          {filteredMeetings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-medium text-slate-900">No meetings</h3>
              <p className="text-sm text-slate-500 mt-1">Schedule your first meeting</p>
            </div>
          ) : (
            filteredMeetings.map((meeting) => (
              <motion.div
                key={meeting.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900">{meeting.title}</h3>
                      <Badge variant={
                        meeting.status === "completed" ? "secondary" :
                        meeting.status === "cancelled" ? "destructive" : "default"
                      }>
                        {meeting.status}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(meeting.date), 'MMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {meeting.start_time} - {meeting.end_time}
                      </span>
                      {meeting.attendees?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {meeting.attendees.length} attendees
                        </span>
                      )}
                      {meeting.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {meeting.location}
                        </span>
                      )}
                    </div>

                    {meeting.meeting_link && (
                      <a 
                        href={meeting.meeting_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline mt-2"
                      >
                        <Video className="w-4 h-4" />
                        Join Meeting
                      </a>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(meeting)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => updateMutation.mutate({ id: meeting.id, data: { status: "completed" } })}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Complete
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => updateMutation.mutate({ id: meeting.id, data: { status: "cancelled" } })}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteMutation.mutate(meeting.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={(open) => {
        setShowForm(open);
        if (!open) {
          setEditingMeeting(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMeeting ? "Edit Meeting" : "Schedule Meeting"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Meeting title"
                required
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Meeting agenda..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      {formData.date ? format(new Date(formData.date), 'MMM d') : 'Pick'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={formData.date ? new Date(formData.date) : undefined}
                      onSelect={(d) => setFormData({ ...formData, date: d?.toISOString().split('T')[0] || '' })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Start</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>End</Label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Attendees</Label>
              <div className="flex gap-2">
                <Input
                  value={attendeeInput}
                  onChange={(e) => setAttendeeInput(e.target.value)}
                  placeholder="Email address"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
                />
                <Button type="button" onClick={addAttendee}>Add</Button>
              </div>
              {formData.attendees.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.attendees.map((email) => (
                    <Badge key={email} variant="secondary" className="gap-1">
                      {email}
                      <button type="button" onClick={() => removeAttendee(email)}>×</button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Room or address"
                />
              </div>
              <div>
                <Label>Meeting Link</Label>
                <Input
                  value={formData.meeting_link}
                  onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                  placeholder="Zoom/Meet URL"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">{editingMeeting ? "Update" : "Schedule"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}