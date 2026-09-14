'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { FormField } from '@/components/ui/FormField';
import { SelectField } from '@/components/ui/SelectField';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/lib/auth-context';
import { SUPPORTED_COUNTRIES } from '@/types';

const schema = z
  .object({
    fullName: z.string().min(2, 'Enter your full name').max(120),
    email: z.string().email('Enter a valid email address'),
    password: z
      .string()
      .min(10, 'Password must be at least 10 characters')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/[a-z]/, 'Must include a lowercase letter')
      .regex(/\d/, 'Must include a number')
      .regex(/[^a-zA-Z0-9]/, 'Must include a symbol'),
    confirmPassword: z.string(),
    country: z.string().min(2, 'Select your country'),
    role: z.enum(['buyer', 'seller'], { required_error: 'Select your account type' }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type FormValues = z.infer<typeof schema>;

const countryOptions = SUPPORTED_COUNTRIES.map((c) => ({ value: c.code, label: c.name }));
const roleOptions = [
  { value: 'buyer', label: 'Buyer — I want to browse and purchase property' },
  { value: 'seller', label: 'Seller — I want to list property for sale' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await signUp({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        country: values.country,
        role: values.role,
      });
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message;
      setServerError(
        Array.isArray(msg) ? msg.join(' ') : msg ?? 'Something went wrong. Please try again.',
      );
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold text-gray-900 mb-2">Create your account</h2>
        <p className="text-gray-500 text-sm">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary-700 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      {serverError && <Alert message={serverError} className="mb-6" />}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        <FormField
          label="Full name"
          type="text"
          autoComplete="name"
          placeholder="Ada Okafor"
          required
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <FormField
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="ada@example.com"
          required
          error={errors.email?.message}
          {...register('email')}
        />

        <FormField
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="Min. 10 characters"
          required
          hint="Must include uppercase, lowercase, a number, and a symbol."
          error={errors.password?.message}
          {...register('password')}
        />

        <FormField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          required
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <SelectField
          label="Country"
          options={countryOptions}
          placeholder="Select your country"
          required
          error={errors.country?.message}
          {...register('country')}
        />

        <SelectField
          label="Account type"
          options={roleOptions}
          placeholder="Select account type"
          required
          error={errors.role?.message}
          {...register('role')}
        />

        <button type="submit" disabled={isSubmitting} className="btn-primary mt-2 w-full">
          {isSubmitting ? (
            <>
              <Spinner size="sm" className="text-white" />
              Creating account…
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <p className="mt-6 text-xs text-gray-400 text-center leading-relaxed">
        By creating an account you agree to Kleroge&apos;s Terms of Service and Privacy Policy.
      </p>
    </AuthLayout>
  );
}
