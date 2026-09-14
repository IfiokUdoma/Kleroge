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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await signIn({ email: values.email, password: values.password });
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message;
      setServerError(
        Array.isArray(msg) ? msg.join(' ') : msg ?? 'Invalid email or password.',
      );
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
        <p className="text-gray-500 text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="text-primary-700 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>

      {serverError && <Alert message={serverError} className="mb-6" />}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        <FormField
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="ada@example.com"
          required
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="flex flex-col gap-1">
          <FormField
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            required
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex justify-end mt-1">
            <Link
              href="/auth/forgot-password"
              className="text-xs text-primary-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary mt-2 w-full">
          {isSubmitting ? (
            <>
              <Spinner size="sm" className="text-white" />
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
