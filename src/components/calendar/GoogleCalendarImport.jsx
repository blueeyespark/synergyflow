import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar, Loader2, CheckCircle, Download } from "lucide-react";
import { toast } from "sonner";

export default function GoogleCalendarImport({ open, onOpenChange, onImported }) {
  const [projectId, setProjectId] = useState('');
  const [daysAhead, setDaysAhead] = useState(30);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const handleImport = async () => {
    setLoading(true);
    setResult(null);
    const res = await base44.functions.invoke('importGoogleCalendar', {
      project_id: projectId || undefined,
      days_ahead: daysAhead,
    });
    setLoading(false);
    if (res.data?.imported >= 0) {
      setResult(res.data);
      toast.success(`Imported ${res.data.imported} events as tasks!`);
      onImported?.();
    } else {
      toast.error('Import failed. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" /> Import from Google Calendar
          </DialogTitle>
        </DialogHeader>
        {result ? (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{result.imported} events imported!</h3>
            <p className="text-sm text-slate-500 mt-1">Calendar events have been added as tasks.</p>
            <Button className="mt-4" onClick={() => { setResult(null); onOpenChange(false); }}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            <div>
              <Label>Assign to Project (optional)</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="No project — just create tasks" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No project</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Import events for next (days)</Label>
              <Input type="number" min={1} max={365} value={daysAhead} onChange={e => setDaysAhead(Number(e.target.value))} />
            </div>
            <p className="text-xs text-slate-400">Events from your primary Google Calendar will be imported as tasks with their dates and descriptions.</p>
            <Button className="w-full" onClick={handleImport} disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</> : <><Download className="w-4 h-4 mr-2" /> Import Events</>}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}