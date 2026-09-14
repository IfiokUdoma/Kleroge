'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/lib/auth-context';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await signIn({ email: values.email, password: values.password });
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setServerError(msg ?? 'Invalid email or password.');
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold-600 mb-3">Welcome back</p>
        <h2 className="font-display text-3xl font-bold text-navy-950 mb-2">Sign in to Kleroge</h2>
        <p className="text-stone-500 text-sm">
          No account?{' '}
          <Link href="/auth/register" className="text-navy-700 font-semibold hover:text-gold-600 transition-colors">
            Create one free →
          </Link>
        </p>
      </div>

      {serverError && <Alert message={serverError} className="mb-6" />}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        <FormField
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          error={errors.email?.message}
          {...register('email')}
        />
        <div>
          <FormField
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            required
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex justify-end mt-2">
            <Link href="/auth/forgot-password" className="text-xs text-navy-500 hover:text-gold-600 transition-colors">
              Forgot password?
            </Link>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-1 py-3">
          {isSubmitting ? <><Spinner size="sm" className="text-white" /> Signing in…</> : 'Sign in'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-stone-200 text-center">
        <p className="text-xs text-stone-400">
          © {new Date().getFullYear()} Kleroge · A Khokmah Technologies product
        </p>
      </div>
    </AuthLayout>
  );
}
