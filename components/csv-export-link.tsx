import { Download } from "lucide-react";

export function ExportCSVLink({ href, label = "Export CSV" }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      download
      className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-white/70 hover:bg-white border border-border text-ink shadow-sm transition-colors"
      aria-label={label}
    >
      <Download className="w-4 h-4" aria-hidden="true" />
      {label}
    </a>
  );
}
