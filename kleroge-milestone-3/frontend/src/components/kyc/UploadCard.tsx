'use client';

import { useRef, useState } from 'react';
import { CheckCircle2, FileText, Loader2, Upload, X } from 'lucide-react';
import { clsx } from 'clsx';
import { KycDocument, formatFileSize, uploadKycFile } from '@/lib/kyc';

interface UploadCardProps {
  title: string;
  description: string;
  hint: string;
  endpoint: 'identity' | 'address' | 'selfie';
  existingDoc: KycDocument | undefined;
  disabled: boolean;
  onUploaded: (doc: KycDocument) => void;
}

const statusConfig = {
  uploaded:     { label: 'Uploaded',     cls: 'badge-navy' },
  under_review: { label: 'Under review', cls: 'badge-gold' },
  accepted:     { label: 'Accepted ✓',   cls: 'badge-green' },
  rejected:     { label: 'Rejected',     cls: 'badge-red' },
};

export function UploadCard({ title, description, hint, endpoint, existingDoc, disabled, onUploaded }: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isAccepted = existingDoc?.status === 'accepted';
  const isUnderReview = existingDoc?.status === 'under_review';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('File too large. Max 10MB.'); return; }
    setError(null); setUploading(true); setProgress(0);
    try {
      const doc = await uploadKycFile(endpoint, file, setProgress);
      onUploaded(doc);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Upload failed. Please try again.');
    } finally {
      setUploading(false); setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const cfg = existingDoc ? statusConfig[existingDoc.status] : null;

  return (
    <div className={clsx(
      'card p-5 transition-all duration-200',
      isAccepted && 'border-forest-200 bg-forest-50/30',
      disabled && !isAccepted && 'opacity-70',
    )}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-navy-900">{title}</p>
            {isAccepted && <CheckCircle2 className="w-4 h-4 text-forest-600" />}
          </div>
          <p className="text-xs text-stone-400">{description}</p>
        </div>
        {cfg && <span className={`${cfg.cls} shrink-0`}>{cfg.label}</span>}
      </div>

      {/* File info */}
      {existingDoc && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-stone-50 rounded-lg border border-stone-100">
          <FileText className="w-4 h-4 text-navy-400 shrink-0" />
          <span className="text-xs text-navy-700 truncate flex-1 font-medium">{existingDoc.originalName}</span>
          <span className="text-xs text-stone-400 shrink-0">{formatFileSize(existingDoc.sizeBytes)}</span>
        </div>
      )}

      {/* Rejection reason */}
      {existingDoc?.status === 'rejected' && existingDoc.rejectionReason && (
        <div className="flex gap-2 p-3 bg-red-50 border border-red-100 rounded-lg mb-3">
          <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{existingDoc.rejectionReason}</p>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-stone-400">Uploading…</span>
            <span className="text-xs text-navy-600 font-medium">{progress}%</span>
          </div>
          <div className="h-1 bg-stone-200 rounded-full overflow-hidden">
            <div className="h-full bg-navy-700 rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
      <p className="text-xs text-stone-400 mb-3">{hint}</p>

      {!isAccepted && !isUnderReview && (
        <>
          <input ref={inputRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleFileChange} disabled={disabled || uploading} />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-dashed border-stone-200 text-sm text-stone-400 hover:border-navy-300 hover:text-navy-600 hover:bg-navy-50/50 transition-colors duration-150 disabled:cursor-not-allowed"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {existingDoc ? 'Replace file' : 'Choose file'}
          </button>
        </>
      )}
    </div>
  );
}
