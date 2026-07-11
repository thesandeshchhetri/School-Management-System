"use client";

import { useRef, useState } from "react";
import { Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

type ImportResult = {
  created?: number;
  updated?: number;
  skipped?: number;
  errors?: string[];
  error?: string;
};

export function ImportCSVButton({
  action,
  label = "Import CSV",
  templateHint,
}: {
  action: string;
  label?: string;
  templateHint: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const router = useRouter();

  async function handleFile(file: File) {
    setPending(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch(action, { method: "POST", body: formData });
      const data: ImportResult = await res.json();
      setResult(data);
      router.refresh();
    } catch {
      setResult({ error: "Upload failed. Check your connection and try again." });
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border border-border text-ink-soft hover:bg-border/50 transition-colors cursor-pointer">
        <Upload className="w-4 h-4" aria-hidden="true" />
        {pending ? "Uploading…" : label}
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          aria-label={`${label} — ${templateHint}`}
          disabled={pending}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </label>
      <p className="text-xs text-ink-soft mt-1">{templateHint}</p>

      {result && (
        <div
          role="status"
          aria-live="polite"
          className="mt-2 rounded-lg border border-border bg-surface p-3 text-xs max-w-sm"
        >
          {result.error ? (
            <p className="flex items-center gap-1.5 text-danger">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              {result.error}
            </p>
          ) : (
            <>
              <p className="flex items-center gap-1.5 text-success font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                {result.created ?? 0} created
                {typeof result.updated === "number" ? `, ${result.updated} updated` : ""}
                {typeof result.skipped === "number" ? `, ${result.skipped} skipped` : ""}
              </p>
              {!!result.errors?.length && (
                <ul className="mt-1.5 space-y-0.5 text-ink-soft list-disc list-inside">
                  {result.errors.slice(0, 8).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                  {result.errors.length > 8 && <li>…and {result.errors.length - 8} more</li>}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
