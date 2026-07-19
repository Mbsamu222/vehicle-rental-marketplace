"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { cn } from "../utils/cn";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * No object-storage endpoint exists yet on the backend (pre-uploaded URLs are expected).
 * Defaults to inlining the file as a data: URL, which satisfies the backend's `url()`
 * validation and works end-to-end in dev; pass `uploadFn` once S3/R2 is wired up.
 */
export function FileUpload({
  label,
  accept = "image/*",
  multiple = false,
  value,
  onChange,
  uploadFn = fileToDataUrl,
}: {
  label?: string;
  accept?: string;
  multiple?: boolean;
  value: string[];
  onChange: (urls: string[]) => void;
  uploadFn?: (file: File) => Promise<string>;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList?.length) return;
      setIsUploading(true);
      try {
        const urls = await Promise.all(Array.from(fileList).map(uploadFn));
        onChange(multiple ? [...value, ...urls] : urls.slice(0, 1));
      } finally {
        setIsUploading(false);
      }
    },
    [multiple, onChange, uploadFn, value],
  );

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium text-primary dark:text-white">{label}</label>}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-6 py-8 text-center transition-colors dark:border-dark-border",
          isDragging ? "border-secondary bg-secondary-50 dark:bg-secondary-500/10" : "hover:border-secondary/50",
        )}
      >
        {isUploading ? <Loader2 className="animate-spin text-secondary" /> : <UploadCloud className="text-primary-300" />}
        <p className="text-sm text-primary-400">
          <span className="font-medium text-secondary">Click to upload</span> or drag and drop
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((url, idx) => (
            <div key={idx} className="group relative size-20 overflow-hidden rounded-lg border border-border dark:border-dark-border">
              <img src={url} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== idx))}
                className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
