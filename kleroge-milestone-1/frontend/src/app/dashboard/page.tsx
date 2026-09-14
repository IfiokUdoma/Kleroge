'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';

// KYC status labels for user-facing display
const kycLabels: Record<string, { label: string; color: string }> = {
  not_started: { label: 'Not started', color: 'text-gray-500' },
  pending: { label: 'Under review', color: 'text-accent-600' },
  approved: { label: 'Verified', color: 'text-primary-700' },
  rejected: { label: 'Rejected — resubmit required', color: 'text-red-600' },
};

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" className="text-primary-700" />
      </div>
    );
  }

  if (!user) return null;

  const kyc = kycLabels[user.kycStatus] ?? kycLabels.not_started;

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Nav */}
      <header className="bg-white border-b border-surface-200 px-6 py-4 flex items-center justify-between">
        <span className="font-display text-xl font-semibold text-primary-800">Kleroge</span>
        <button onClick={handleSignOut} className="btn-secondary text-sm px-4 py-2">
          Sign out
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-1">
          Good day, {user.fullName.split(' ')[0]}
        </h1>
        <p className="text-gray-500 text-sm mb-10">
          {user.role === 'buyer' ? 'Buyer account' : 'Seller account'} · {user.country}
        </p>

        {/* KYC prompt */}
        {user.kycStatus !== 'approved' && (
          <Alert
            variant={user.kycStatus === 'rejected' ? 'error' : 'info'}
            message={
              user.kycStatus === 'not_started'
                ? 'Complete identity verification to start transacting on Kleroge.'
                : user.kycStatus === 'pending'
                ? 'Your identity documents are under review. We\'ll notify you once approved.'
                : 'Your verification was rejected. Please resubmit your documents.'
            }
            className="mb-8"
          />
        )}

        {/* Profile card */}
        <div className="card p-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Full name</p>
            <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Email</p>
            <p className="text-sm font-medium text-gray-900">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Country</p>
            <p className="text-sm font-medium text-gray-900">{user.country}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">KYC status</p>
            <p className={`text-sm font-semibold ${kyc.color}`}>{kyc.label}</p>
          </div>
        </div>

        {/* Milestone 2 placeholder */}
        {user.kycStatus === 'not_started' && (
          <button className="btn-primary mt-6">
            Start identity verification →
          </button>
        )}

        <p className="mt-10 text-xs text-gray-400">
          More features coming soon. Milestone 2 adds KYC document upload.
        </p>
      </main>
    </div>
  );
}
