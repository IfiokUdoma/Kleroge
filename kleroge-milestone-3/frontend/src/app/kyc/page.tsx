'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Clock, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { KycDocument, getMyDocuments, submitKycForReview } from '@/lib/kyc';
import { UploadCard } from '@/components/kyc/UploadCard';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { Navbar } from '@/components/layout/Navbar';

const UPLOAD_STEPS = [
  {
    key: 'passport' as const,
    endpoint: 'identity' as const,
    title: 'Passport or National ID',
    description: 'Clear photo of the front of your government-issued identity document.',
    hint: 'JPG, PNG, WEBP, or PDF · Max 10MB · Must be valid and not expired.',
  },
  {
    key: 'proof_of_address' as const,
    endpoint: 'address' as const,
    title: 'Proof of Address',
    description: 'Utility bill, bank statement, or official letter with your name and address.',
    hint: 'Must be dated within the last 3 months · JPG, PNG, WEBP, or PDF · Max 10MB.',
  },
  {
    key: 'selfie' as const,
    endpoint: 'selfie' as const,
    title: 'Selfie',
    description: 'Clear photo of your face. Hold your ID next to your face for best results.',
    hint: 'JPG, PNG, or WEBP · Max 10MB · No heavy filters or editing.',
  },
];

export default function KycPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadDocuments = useCallback(async () => {
    try {
      const docs = await getMyDocuments();
      setDocuments(docs);
    } catch { /* silent */ }
    finally { setDocsLoading(false); }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth/login');
    if (user) loadDocuments();
  }, [authLoading, user, router, loadDocuments]);

  const handleUploaded = (doc: KycDocument) => {
    setDocuments(prev => [...prev.filter(d => d.documentType !== doc.documentType), doc]);
  };

  const getDoc = (type: string) => documents.find(d => d.documentType === type);
  const allUploaded = UPLOAD_STEPS.every(s => !!getDoc(s.key));
  const isUnderReview = user?.kycStatus === 'pending';
  const isApproved = user?.kycStatus === 'approved';
  const isRejected = user?.kycStatus === 'rejected';
  const isDisabled = isUnderReview || isApproved;

  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      await submitKycForReview();
      await refreshUser();
      setSubmitSuccess(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSubmitError(msg ?? 'Submission failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (authLoading || docsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Spinner size="lg" className="text-navy-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      {/* Page header */}
      <div className="bg-navy-950 border-b border-navy-900">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-navy-400 hover:text-gold-400 text-xs font-medium mb-4 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Identity Verification</h1>
              <p className="text-navy-300 text-xs mt-0.5">Secure · Confidential · Required to transact</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-8">

        {/* Status banners */}
        {isApproved && (
          <div className="flex items-center gap-4 p-5 bg-forest-50 border border-forest-200 rounded-xl mb-6">
            <CheckCircle2 className="w-5 h-5 text-forest-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-forest-800">Verification complete</p>
              <p className="text-xs text-forest-600 mt-0.5">Your identity has been verified. You can now transact on Kleroge.</p>
            </div>
          </div>
        )}

        {(isUnderReview || submitSuccess) && (
          <div className="flex items-center gap-4 p-5 bg-gold-50 border border-gold-200 rounded-xl mb-6">
            <Clock className="w-5 h-5 text-gold-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gold-800">Documents under review</p>
              <p className="text-xs text-gold-600 mt-0.5">Our compliance team is reviewing your documents. This typically takes 1–2 business days.</p>
            </div>
          </div>
        )}

        {isRejected && !submitSuccess && (
          <div className="flex items-center gap-4 p-5 bg-red-50 border border-red-200 rounded-xl mb-6">
            <XCircle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">Verification rejected</p>
              <p className="text-xs text-red-600 mt-0.5">See the rejection reasons below, upload new documents, and resubmit.</p>
            </div>
          </div>
        )}

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-6">
          {UPLOAD_STEPS.map((step, i) => {
            const doc = getDoc(step.key);
            const done = !!doc;
            return (
              <div key={step.key} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-2 flex-1 p-2.5 rounded-lg text-xs font-medium transition-colors ${
                  done ? 'bg-forest-50 text-forest-700 border border-forest-200' : 'bg-white text-stone-400 border border-stone-200'
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    done ? 'bg-forest-600 text-white' : 'bg-stone-200 text-stone-500'
                  }`}>{done ? '✓' : i + 1}</div>
                  <span className="truncate">{step.title.split(' ')[0]}</span>
                </div>
                {i < UPLOAD_STEPS.length - 1 && <div className="w-4 h-px bg-stone-200 shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* Upload cards */}
        <div className="flex flex-col gap-4 mb-6">
          {UPLOAD_STEPS.map(step => (
            <UploadCard
              key={step.key}
              title={step.title}
              description={step.description}
              hint={step.hint}
              endpoint={step.endpoint}
              existingDoc={getDoc(step.key)}
              disabled={isDisabled}
              onUploaded={handleUploaded}
            />
          ))}
        </div>

        {/* Submit */}
        {!isApproved && !isUnderReview && !submitSuccess && (
          <div className="card p-5">
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-sm font-semibold text-navy-900">
                  {allUploaded ? 'Ready to submit' : `${UPLOAD_STEPS.filter(s => !!getDoc(s.key)).length} of 3 documents uploaded`}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {allUploaded ? 'Review your uploads above, then submit for compliance review.' : 'Upload all three documents before submitting.'}
                </p>
              </div>
              <button onClick={handleSubmit} disabled={!allUploaded || submitting} className="btn-gold shrink-0">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : 'Submit for review'}
              </button>
            </div>
            {submitError && <Alert message={submitError} className="mt-4" />}
          </div>
        )}
      </main>
    </div>
  );
}
