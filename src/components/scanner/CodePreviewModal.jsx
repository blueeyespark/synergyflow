import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Code2 } from "lucide-react";
import { toast } from "sonner";

export default function CodePreviewModal({ open, onOpenChange, title, code, description, filePath }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-500" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden flex flex-col gap-3 mt-2">
          {description && (
            <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
          )}
          {filePath && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg w-fit">
              <Code2 className="w-3 h-3" />
              Suggested file: <span className="font-mono font-medium">{filePath}</span>
            </div>
          )}
          <div className="relative flex-1 overflow-auto">
            <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs overflow-auto max-h-[50vh] leading-relaxed font-mono whitespace-pre-wrap">
              {code}
            </pre>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCopy}
              className="absolute top-3 right-3 h-7 text-xs gap-1"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <p className="text-xs text-slate-400 italic">
            💡 This AI-generated code is a starting point. Review and adapt it to your codebase before applying.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}