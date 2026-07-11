import { Download } from "lucide-react";

export function ExportCSVLink({ href, label = "Export CSV" }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      download
      className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border border-border text-ink-soft hover:bg-border/50 transition-colors"
      aria-label={label}
    >
      <Download className="w-4 h-4" aria-hidden="true" />
      {label}
    </a>
  );
}
