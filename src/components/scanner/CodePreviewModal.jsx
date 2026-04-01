import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Code2, Download } from "lucide-react";
import { toast } from "sonner";

export default function CodePreviewModal({ open, onOpenChange, title, code, description, filePath }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = filePath ? filePath.split('/').pop() : 'component.jsx';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-500" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden flex flex-col gap-3 mt-2">
          {description && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg px-3 py-2">
              <p className="text-sm text-indigo-800 dark:text-indigo-300">{description}</p>
            </div>
          )}
          {filePath && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg w-fit">
              <Code2 className="w-3 h-3" />
              Save to: <span className="font-mono font-medium text-indigo-600 dark:text-indigo-400">{filePath}</span>
            </div>
          )}
          <div className="relative flex-1 overflow-auto min-h-0">
            <div className="flex items-center justify-between bg-zinc-800 rounded-t-xl px-4 py-2">
              <span className="text-xs text-zinc-400 font-mono">{filePath || 'component.jsx'}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={handleDownload} className="h-6 text-xs gap-1 text-zinc-400 hover:text-white">
                  <Download className="w-3 h-3" /> Download
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCopy} className="h-6 text-xs gap-1 text-zinc-400 hover:text-white">
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
            <pre className="bg-zinc-900 text-zinc-100 rounded-b-xl p-4 text-xs overflow-auto max-h-[55vh] leading-relaxed font-mono whitespace-pre">
              {code}
            </pre>
          </div>
          <p className="text-xs text-slate-400 italic">
            💡 Review this AI-generated code before adding it to your project. Copy it or download the file.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}