'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Spinner } from '@/components/ui/Spinner';
import { Navbar } from '@/components/layout/Navbar';
import {
  ShieldCheck, ShieldAlert, Clock, ShieldOff,
  ArrowRight, Building2, FileText, TrendingUp,
} from 'lucide-react';

const kycConfig = {
  not_started: {
    icon: ShieldOff,
    label: 'Identity not verified',
    message: 'Verify your identity to transact on Kleroge.',
    style: 'bg-stone-50 border-stone-200',
    iconStyle: 'bg-stone-100 text-stone-500',
    labelStyle: 'text-stone-700',
    cta: 'Start verification',
    ctaStyle: 'text-navy-700 hover:text-gold-600',
  },
  pending: {
    icon: Clock,
    label: 'Verification under review',
    message: 'Our compliance team is reviewing your documents. Typically 1–2 business days.',
    style: 'bg-gold-50 border-gold-200',
    iconStyle: 'bg-gold-100 text-gold-600',
    labelStyle: 'text-gold-800',
    cta: 'View documents',
    ctaStyle: 'text-gold-700 hover:text-gold-800',
  },
  approved: {
    icon: ShieldCheck,
    label: 'Identity verified',
    message: 'Your identity is verified. You can now buy and sell property on Kleroge.',
    style: 'bg-forest-50 border-forest-200',
    iconStyle: 'bg-forest-100 text-forest-600',
    labelStyle: 'text-forest-800',
    cta: null,
    ctaStyle: '',
  },
  rejected: {
    icon: ShieldAlert,
    label: 'Verification rejected',
    message: 'One or more documents were rejected. Please resubmit with valid documents.',
    style: 'bg-red-50 border-red-200',
    iconStyle: 'bg-red-100 text-red-600',
    labelStyle: 'text-red-800',
    cta: 'Resubmit documents',
    ctaStyle: 'text-red-700 hover:text-red-800',
  },
};

const quickActions = [
  {
    icon: Building2,
    title: 'Browse Properties',
    description: 'Explore verified listings globally',
    href: '/properties',
    roles: ['buyer', 'seller', 'admin'],
    accent: 'bg-navy-50 text-navy-600',
  },
  {
    icon: FileText,
    title: 'List a Property',
    description: 'Create a new property listing',
    href: '/properties/new',
    roles: ['seller'],
    accent: 'bg-gold-50 text-gold-600',
  },
  {
    icon: TrendingUp,
    title: 'My Transactions',
    description: 'Track your active deals',
    href: '/transactions',
    roles: ['buyer', 'seller'],
    accent: 'bg-forest-50 text-forest-600',
    comingSoon: true,
  },
];

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/auth/login');
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Spinner size="lg" className="text-navy-700" />
      </div>
    );
  }
  if (!user) return null;

  const kyc = kycConfig[user.kycStatus] ?? kycConfig.not_started;
  const KycIcon = kyc.icon;
  const visibleActions = quickActions.filter(a => a.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      {/* Hero strip */}
      <div className="bg-navy-950 border-b border-navy-900">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <p className="text-gold-400 text-xs font-semibold uppercase tracking-[0.18em] mb-1">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-white">
            Good day, {user.fullName.split(' ')[0]}.
          </h1>
          <p className="text-navy-300 text-sm mt-1 capitalize">
            {user.role} account · {user.country}
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* KYC banner */}
        <div className={`card border p-5 mb-6 ${kyc.style}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${kyc.iconStyle}`}>
                <KycIcon className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-sm font-semibold ${kyc.labelStyle}`}>{kyc.label}</p>
                <p className="text-xs text-stone-500 mt-0.5 max-w-md">{kyc.message}</p>
              </div>
            </div>
            {kyc.cta && (
              <Link href="/kyc" className={`text-xs font-semibold shrink-0 flex items-center gap-1 ${kyc.ctaStyle} transition-colors`}>
                {kyc.cta} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Quick actions */}
          <div className="lg:col-span-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-400 mb-4">Quick actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {visibleActions.map(action => {
                const Icon = action.icon;
                return (
                  <div key={action.title} className={`card-hover p-5 ${action.comingSoon ? 'opacity-60 cursor-not-allowed' : ''}`}>
                    {action.comingSoon ? (
                      <div>
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${action.accent}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <p className="text-sm font-semibold text-navy-900">{action.title}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{action.description}</p>
                        <span className="badge-gold text-[10px] mt-2">Coming soon</span>
                      </div>
                    ) : (
                      <Link href={action.href} className="block">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${action.accent}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <p className="text-sm font-semibold text-navy-900">{action.title}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{action.description}</p>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Profile card */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-stone-400 mb-4">Account</h2>
            <div className="card p-5">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-navy-800 to-navy-950 flex items-center justify-center mb-4 mx-auto">
                <span className="font-display text-white text-xl font-bold">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-center font-semibold text-navy-950 text-sm">{user.fullName}</p>
              <p className="text-center text-xs text-stone-400 mt-0.5">{user.email}</p>

              <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-stone-400 mb-0.5">Country</p>
                  <p className="text-xs font-semibold text-navy-900">{user.country}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-stone-400 mb-0.5">Role</p>
                  <p className="text-xs font-semibold text-navy-900 capitalize">{user.role}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] uppercase tracking-wide text-stone-400 mb-0.5">KYC Status</p>
                  <p className="text-xs font-semibold capitalize" style={{
                    color: user.kycStatus === 'approved' ? '#17693d'
                         : user.kycStatus === 'pending' ? '#a87b10'
                         : user.kycStatus === 'rejected' ? '#dc2626'
                         : '#6b7280'
                  }}>
                    {user.kycStatus.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
