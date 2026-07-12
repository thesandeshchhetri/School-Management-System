"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  currentUrl?: string | null;
  name: string; // hidden input name that will carry the URL to the server action
  folder?: string;
  shape?: "circle" | "square";
  size?: number;
  label?: string;
}

export function ImageUpload({
  currentUrl,
  name,
  folder = "uploads",
  shape = "square",
  size = 80,
  label = "Change photo",
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string>(currentUrl ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);

    // Local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("folder", folder);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setUploadedUrl(data.url);
    } catch (err) {
      setError((err as Error).message ?? "Upload failed");
      setPreview(currentUrl ?? null);
    } finally {
      setUploading(false);
    }
  }

  const isCircle = shape === "circle";
  const wrapCls = isCircle ? "rounded-full" : "rounded-xl";

  return (
    <div className="flex flex-col gap-2">
      {/* Hidden input carries the blob URL to the server action */}
      <input type="hidden" name={name} value={uploadedUrl} />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label={label}
        style={{ width: size, height: size }}
        className={`relative group overflow-hidden border-2 border-border bg-background flex items-center justify-center shrink-0 ${wrapCls} transition-opacity disabled:opacity-60`}
      >
        {preview ? (
          <Image
            src={preview}
            alt="Preview"
            fill
            className={`object-cover ${wrapCls}`}
            unoptimized
          />
        ) : (
          <Camera className="w-6 h-6 text-ink-soft" aria-hidden="true" />
        )}

        {/* Hover overlay */}
        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" aria-hidden="true" />
          ) : (
            <Camera className="w-5 h-5 text-white" aria-hidden="true" />
          )}
        </span>
      </button>

      <p className="text-xs text-ink-soft">
        {uploading ? "Uploading…" : label}
      </p>

      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        aria-label="Upload image file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
