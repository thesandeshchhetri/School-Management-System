"use client";

import { useRef, useState } from "react";
import { Paperclip, X, Loader2, FileIcon } from "lucide-react";

type Attachment = { name: string; url: string; mimeType: string };

export function NoteAttachmentUploader({ name = "attachments" }: { name?: string }) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    setUploading(true);
    setError(null);
    const added: Attachment[] = [];
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.set("file", file);
        fd.set("folder", "note-attachments");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        added.push({ name: file.name, url: data.url, mimeType: file.type });
      } catch (e) {
        setError(`Failed to upload ${file.name}: ${(e as Error).message}`);
      }
    }
    setAttachments((prev) => [...prev, ...added]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      {/* Hidden input carries JSON to the server action */}
      <input type="hidden" name={name} value={JSON.stringify(attachments)} />

      {/* Uploaded list */}
      {attachments.length > 0 && (
        <ul className="space-y-1">
          {attachments.map((a, i) => (
            <li key={i} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <FileIcon className="w-4 h-4 text-ink-soft shrink-0" aria-hidden="true" />
              <span className="flex-1 truncate text-xs">{a.name}</span>
              <button
                type="button"
                aria-label={`Remove ${a.name}`}
                className="text-ink-soft hover:text-danger"
                onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Upload button */}
      <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-ink-soft hover:bg-background cursor-pointer transition-colors">
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          <Paperclip className="w-4 h-4" aria-hidden="true" />
        )}
        {uploading ? "Uploading…" : "Attach files"}
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          disabled={uploading}
          aria-label="Attach files to this note"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </label>

      {error && (
        <p className="text-xs text-danger" role="alert">{error}</p>
      )}
    </div>
  );
}
