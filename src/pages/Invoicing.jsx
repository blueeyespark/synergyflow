import { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FileText, DollarSign, Send, Download, Plus, Loader2, CheckCircle, Clock, Trash2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

const DEFAULT_RATE = 75; // $/hr

function fmtDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtMoney(n) {
  return `$${Number(n).toFixed(2)}`;
}

export default function Invoicing() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [sending, setSending] = useState(null);

  const { data: timeEntries = [] } = useQuery({
    queryKey: ["time-entries"],
    queryFn: () => base44.entities.TimeEntry.list("-created_date"),
  });
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list(),
  });
  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => base44.entities.Budget.filter({ type: "income", category: "invoice" }, "-created_date"),
  });

  // Group billable time by project
  const projectStats = useMemo(() => {
    return projects.map(p => {
      const entries = timeEntries.filter(e => e.project_id === p.id && e.is_billable);
      const totalSeconds = entries.reduce((s, e) => s + (e.duration_seconds || 0), 0);
      const hours = totalSeconds / 3600;
      const projectRate = p.hourly_rate || rate;
      return { project: p, entries, totalSeconds, hours, amount: hours * projectRate };
    }).filter(s => s.entries.length > 0);
  }, [timeEntries, projects, rate]);

  const selectedStats = projectStats.find(s => s.project.id === selectedProject);

  const generatePDF = (proj, entries, clientN, clientE, hourlyRate, invoiceNum) => {
    const doc = new jsPDF();
    const totalSeconds = entries.reduce((s, e) => s + (e.duration_seconds || 0), 0);
    const hours = totalSeconds / 3600;
    const amount = hours * hourlyRate;

    // Header
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 20, 25);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`#${invoiceNum}`, 20, 33);
    doc.text(`Date: ${format(new Date(), "MMMM d, yyyy")}`, 120, 25);
    doc.text(`Due: ${format(new Date(Date.now() + 30 * 86400000), "MMMM d, yyyy")}`, 120, 33);

    // Bill To
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO", 20, 55);
    doc.setFont("helvetica", "normal");
    doc.text(clientN || "Client", 20, 63);
    if (clientE) doc.text(clientE, 20, 70);

    // Project info
    doc.setFont("helvetica", "bold");
    doc.text("PROJECT", 120, 55);
    doc.setFont("helvetica", "normal");
    doc.text(proj.name, 120, 63);
    doc.text(`Rate: $${hourlyRate}/hr`, 120, 70);

    // Table header
    const tableY = 85;
    doc.setFillColor(245, 247, 250);
    doc.rect(15, tableY, 180, 10, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Date", 20, tableY + 7);
    doc.text("Description", 50, tableY + 7);
    doc.text("Duration", 130, tableY + 7);
    doc.text("Amount", 165, tableY + 7);

    // Rows
    doc.setFont("helvetica", "normal");
    let y = tableY + 18;
    entries.forEach((e, i) => {
      if (y > 260) { doc.addPage(); y = 20; }
      const h = (e.duration_seconds || 0) / 3600;
      const rowAmt = h * hourlyRate;
      if (i % 2 === 0) { doc.setFillColor(250, 251, 252); doc.rect(15, y - 5, 180, 10, "F"); }
      doc.text(e.start_time ? format(parseISO(e.start_time), "MMM d") : "—", 20, y);
      doc.text((e.task_title || e.notes || "Time entry").substring(0, 40), 50, y);
      doc.text(fmtDuration(e.duration_seconds || 0), 130, y);
      doc.text(fmtMoney(rowAmt), 165, y);
      y += 12;
    });

    // Total
    y += 5;
    doc.setFillColor(99, 102, 241);
    doc.rect(120, y, 75, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`TOTAL: ${fmtMoney(amount)}`, 125, y + 9);

    // Footer
    doc.setTextColor(150);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Thank you for your business! Payment due within 30 days.", 20, 280);

    return { doc, amount, hours };
  };

  const createInvoice = async () => {
    if (!selectedProject || !selectedStats) return;
    const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;
    const { doc, amount } = generatePDF(
      selectedStats.project,
      selectedStats.entries,
      clientName,
      clientEmail,
      Number(rate),
      invoiceNum
    );
    doc.save(`${invoiceNum}-${selectedStats.project.name.replace(/\s+/g, "-")}.pdf`);
    // Record as income
    await base44.entities.Budget.create({
      title: `Invoice ${invoiceNum} — ${selectedStats.project.name}`,
      amount,
      type: "income",
      category: "invoice",
      date: format(new Date(), "yyyy-MM-dd"),
      notes: `Client: ${clientName} (${clientEmail}) | ${selectedStats.entries.length} time entries`,
      project_id: selectedProject,
    });
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    toast.success(`Invoice ${invoiceNum} generated & saved!`);
    setShowCreate(false);
    setClientName(""); setClientEmail(""); setSelectedProject("");
  };

  const emailInvoice = async (stats) => {
    setSending(stats.project.id);
    const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;
    const emailBody = `Hi,\n\nPlease find attached invoice ${invoiceNum} for ${stats.project.name}.\n\nSummary:\n• Hours worked: ${stats.hours.toFixed(2)}h\n• Total amount: ${fmtMoney(stats.amount)}\n• Due date: ${format(new Date(Date.now() + 30 * 86400000), "MMMM d, yyyy")}\n\nThank you for your business!\n\n— Planify Invoicing`;
    await base44.integrations.Core.SendEmail({
      to: clientEmail || "client@example.com",
      subject: `Invoice ${invoiceNum} — ${stats.project.name}`,
      body: emailBody,
    });
    setSending(null);
    toast.success("Invoice emailed successfully!");
  };

  const totalBillable = projectStats.reduce((s, p) => s + p.amount, 0);
  const totalHours = projectStats.reduce((s, p) => s + p.hours, 0);
  const invoicedTotal = invoices.reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50/20 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Invoicing</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Generate professional invoices from tracked billable time</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
            <Plus className="w-4 h-4 mr-1.5" /> Create Invoice
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Billable (unbilled)", value: fmtMoney(totalBillable), icon: DollarSign, color: "text-green-600 bg-green-100" },
            { label: "Total Hours Tracked", value: `${totalHours.toFixed(1)}h`, icon: Clock, color: "text-blue-600 bg-blue-100" },
            { label: "Total Invoiced", value: fmtMoney(invoicedTotal), icon: CheckCircle, color: "text-indigo-600 bg-indigo-100" },
          ].map(({ label, value, icon: Icon, color }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Billable Projects */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm mb-6">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200">Billable Time by Project</h2>
          </div>
          {projectStats.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No billable time yet</p>
              <p className="text-sm mt-1">Use the stopwatch on task cards to track billable hours</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {projectStats.map(({ project, entries, hours, amount }) => (
                <div key={project.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 dark:text-slate-200">{project.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{entries.length} entries · {hours.toFixed(2)}h · <span className="text-green-600 font-semibold">{fmtMoney(amount)}</span></p>
                    {/* Mini bar */}
                    <div className="mt-2 w-full max-w-xs bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min((hours / 40) * 100, 100)}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" variant="outline" onClick={() => {
                      setSelectedProject(project.id);
                      setRate(project.hourly_rate || DEFAULT_RATE);
                      setShowCreate(true);
                    }}>
                      <FileText className="w-3.5 h-3.5 mr-1" /> Invoice
                    </Button>
                    <Button size="sm" variant="ghost" disabled={sending === project.id}
                      onClick={() => emailInvoice({ project, entries, hours, amount })}>
                      {sending === project.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Invoices */}
        {invoices.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-semibold text-slate-800 dark:text-slate-200">Invoice History</h2>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {invoices.map(inv => (
                <div key={inv.id} className="px-5 py-3 flex items-center gap-4">
                  <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{inv.title}</p>
                    <p className="text-xs text-slate-400">{inv.notes}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-green-600">{fmtMoney(inv.amount)}</p>
                    <p className="text-xs text-slate-400">{inv.date ? format(parseISO(inv.date), "MMM d, yyyy") : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" /> Generate Invoice
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Project *</Label>
              <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
                className="w-full mt-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">Select project...</option>
                {projectStats.map(s => (
                  <option key={s.project.id} value={s.project.id}>
                    {s.project.name} — {s.hours.toFixed(1)}h ({fmtMoney(s.amount)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Client Name</Label>
              <Input placeholder="Acme Corp" value={clientName} onChange={e => setClientName(e.target.value)} />
            </div>
            <div>
              <Label>Client Email</Label>
              <Input type="email" placeholder="client@example.com" value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
            </div>
            <div>
              <Label>Hourly Rate ($/hr)</Label>
              <Input type="number" min="0" value={rate} onChange={e => setRate(e.target.value)} />
              {selectedStats && (
                <p className="text-xs text-green-600 font-semibold mt-1">
                  Total: {fmtMoney(selectedStats.hours * Number(rate))} ({selectedStats.hours.toFixed(2)}h)
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={createInvoice} disabled={!selectedProject} className="flex-1 bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4 mr-1.5" /> Download PDF
              </Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}