import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, DollarSign, Clock, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import jsPDF from "jspdf";

function formatSeconds(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function ProjectInvoicePanel({ projects = [], entries = [] }) {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [hourlyRate, setHourlyRate] = useState("100");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Compute per-project billing summary
  const projectBilling = projects.map(p => {
    const pEntries = entries.filter(e => e.project_id === p.id && e.duration_seconds && e.is_billable);
    const totalSecs = pEntries.reduce((s, e) => s + (e.duration_seconds || 0), 0);
    const hours = totalSecs / 3600;
    // Use entry-level rate if available, else fallback to panel rate
    const billable = pEntries.reduce((s, e) => s + ((e.duration_seconds / 3600) * (e.hourly_rate || parseFloat(hourlyRate) || 0)), 0);
    return { ...p, totalSecs, hours, billable, entryCount: pEntries.length };
  }).filter(p => p.totalSecs > 0);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedBilling = projectBilling.find(p => p.id === selectedProjectId);
  const rate = parseFloat(hourlyRate) || 0;
  const totalAmount = selectedBilling
    ? entries.filter(e => e.project_id === selectedProjectId && e.is_billable && e.duration_seconds)
        .reduce((s, e) => s + ((e.duration_seconds / 3600) * (e.hourly_rate || rate)), 0)
    : 0;

  const generatePDF = async () => {
    if (!selectedProject || !selectedBilling) return;
    setGenerating(true);

    const invoiceEntries = entries.filter(e => e.project_id === selectedProjectId && e.is_billable && e.duration_seconds);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text("INVOICE", 20, 22);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Date: ${format(new Date(), 'MMMM d, yyyy')}`, pageWidth - 20, 18, { align: 'right' });
    doc.text(`Invoice #: INV-${Date.now().toString().slice(-6)}`, pageWidth - 20, 27, { align: 'right' });

    // Project & Client Info
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text("Project:", 20, 55);
    doc.setFont(undefined, 'normal');
    doc.text(selectedProject.name, 55, 55);

    if (clientName) {
      doc.setFont(undefined, 'bold');
      doc.text("Bill To:", 20, 65);
      doc.setFont(undefined, 'normal');
      doc.text(clientName, 55, 65);
      if (clientEmail) doc.text(clientEmail, 55, 73);
    }

    // Table header
    const tableY = clientName ? 90 : 75;
    doc.setFillColor(241, 245, 249);
    doc.rect(20, tableY - 6, pageWidth - 40, 10, 'F');
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text("Description", 22, tableY);
    doc.text("Date", 95, tableY);
    doc.text("Duration", 125, tableY);
    doc.text("Rate", 155, tableY);
    doc.text("Amount", pageWidth - 22, tableY, { align: 'right' });

    // Table rows
    doc.setFont(undefined, 'normal');
    let y = tableY + 10;
    invoiceEntries.forEach((e, i) => {
      if (y > 260) { doc.addPage(); y = 20; }
      const rowAmt = (e.duration_seconds / 3600) * (e.hourly_rate || rate);
      if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(20, y - 5, pageWidth - 40, 9, 'F'); }
      doc.setFontSize(8);
      doc.text((e.task_title || "Work").substring(0, 30), 22, y);
      doc.text(e.start_time ? format(new Date(e.start_time), 'MMM d') : '-', 95, y);
      doc.text(formatSeconds(e.duration_seconds), 125, y);
      doc.text(`$${(e.hourly_rate || rate).toFixed(0)}/hr`, 155, y);
      doc.text(`$${rowAmt.toFixed(2)}`, pageWidth - 22, y, { align: 'right' });
      y += 10;
    });

    // Total
    y += 5;
    doc.setDrawColor(226, 232, 240);
    doc.line(20, y, pageWidth - 20, y);
    y += 8;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(99, 102, 241);
    doc.text("TOTAL DUE:", pageWidth - 70, y);
    doc.text(`$${totalAmount.toFixed(2)}`, pageWidth - 22, y, { align: 'right' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont(undefined, 'normal');
    doc.text("Generated by Planify • Thank you for your business!", pageWidth / 2, 285, { align: 'center' });

    doc.save(`invoice-${selectedProject.name.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success("Invoice PDF downloaded!");
    setGenerating(false);
    setShowModal(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-600" /> Project Billing & Invoicing
        </h2>
      </div>

      {/* Per-project billing summary */}
      {projectBilling.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">No billable time entries yet.</p>
      ) : (
        <div className="space-y-2 mb-4">
          {projectBilling.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color || '#6366f1' }} />
              <span className="text-sm font-medium text-slate-700 flex-1 truncate">{p.name}</span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />{formatSeconds(p.totalSecs)}
              </span>
              <span className="text-sm font-semibold text-green-600">${p.billable.toFixed(0)}</span>
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={() => setShowModal(true)}
        disabled={projectBilling.length === 0}
        variant="outline"
        className="w-full gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
      >
        <FileText className="w-4 h-4" /> Generate Invoice PDF
      </Button>

      {/* Invoice Config Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" /> Invoice Draft
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Project</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select project..." /></SelectTrigger>
                <SelectContent>
                  {projectBilling.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} — {formatSeconds(p.totalSecs)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Default Hourly Rate ($/hr)</Label>
              <Input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} className="mt-1" placeholder="100" />
              <p className="text-xs text-slate-400 mt-1">Used for entries without a specific rate set.</p>
            </div>
            <div>
              <Label>Client Name</Label>
              <Input value={clientName} onChange={e => setClientName(e.target.value)} className="mt-1" placeholder="Acme Corp" />
            </div>
            <div>
              <Label>Client Email</Label>
              <Input value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="mt-1" placeholder="client@example.com" />
            </div>
            {selectedBilling && (
              <div className="bg-indigo-50 rounded-xl p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Billable Hours</span>
                  <span className="font-medium">{formatSeconds(selectedBilling.totalSecs)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-600">Entries</span>
                  <span className="font-medium">{selectedBilling.entryCount}</span>
                </div>
                <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-indigo-100">
                  <span className="text-indigo-700">Total Due</span>
                  <span className="text-indigo-700">${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button
                onClick={generatePDF}
                disabled={!selectedProjectId || generating}
                className="bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}