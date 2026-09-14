'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, CheckCircle2, ImagePlus, Loader2, Send, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/layout/Navbar';
import { FormField } from '@/components/ui/FormField';
import { SelectField } from '@/components/ui/SelectField';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import {
  createProperty, uploadPropertyImage, submitPropertyForApproval,
  Property, PROPERTY_TYPE_LABELS,
} from '@/lib/properties';
import { SUPPORTED_COUNTRIES } from '@/types';

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  propertyType: z.enum(['residential','commercial','land','industrial','mixed_use']),
  country: z.string().length(2, 'Select a country'),
  city: z.string().min(1, 'City is required').max(100),
  address: z.string().max(255).optional(),
  price: z.number({ invalid_type_error: 'Enter a valid price' }).positive('Price must be positive'),
  currency: z.enum(['USD','GBP','EUR','NGN','GHS','KES','ZAR','AED']),
  areaSqm: z.number().positive().optional(),
  bedrooms: z.number().int().min(0).max(100).optional(),
  bathrooms: z.number().int().min(0).max(100).optional(),
});
type FormValues = z.infer<typeof schema>;

const typeOptions = Object.entries(PROPERTY_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }));
const currencyOptions = ['USD','GBP','EUR','NGN','GHS','KES','ZAR','AED'].map(c => ({ value: c, label: c }));
const countryOptions = SUPPORTED_COUNTRIES.map(c => ({ value: c.code, label: c.name }));

type Step = 'details' | 'images' | 'review';

export default function NewPropertyPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>('details');
  const [property, setProperty] = useState<Property | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/auth/login');
    if (!isLoading && user && user.role !== 'seller') router.replace('/dashboard');
    if (!isLoading && user && user.kycStatus !== 'approved') router.replace('/kyc');
  }, [isLoading, user, router]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currency: 'USD', propertyType: 'residential' },
  });

  const onDetailsSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const created = await createProperty({
        ...values,
        price: Number(values.price),
        areaSqm: values.areaSqm ? Number(values.areaSqm) : undefined,
        bedrooms: values.bedrooms ? Number(values.bedrooms) : undefined,
        bathrooms: values.bathrooms ? Number(values.bathrooms) : undefined,
      });
      setProperty(created);
      setStep('images');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(' ') : msg ?? 'Failed to create listing. Please try again.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !property) return;
    if (images.length + files.length > 10) { setError('Maximum 10 images per listing.'); return; }

    setUploading(true); setError(null);
    try {
      let updated = property;
      for (const file of files) {
        updated = await uploadPropertyImage(property.id, file);
      }
      setProperty(updated);
      setImages(updated.imagePaths);
    } catch {
      setError('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleSubmitListing = async () => {
    if (!property) return;
    setSubmitting(true); setError(null);
    try {
      await submitPropertyForApproval(property.id);
      router.push('/dashboard?listed=true');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <Spinner size="lg" className="text-navy-700" />
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      {/* Header */}
      <div className="bg-navy-950 border-b border-navy-900">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-navy-400 hover:text-gold-400 text-xs font-medium mb-4 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
          </Link>
          <h1 className="font-display text-2xl font-bold text-white">List a Property</h1>
          <p className="text-navy-300 text-xs mt-1">Your listing will be reviewed by our team before going live.</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="border-b border-stone-200 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex">
            {(['details', 'images', 'review'] as Step[]).map((s, i) => (
              <div key={s} className={`flex items-center gap-2 px-4 py-4 text-xs font-medium border-b-2 transition-colors ${
                step === s ? 'border-navy-950 text-navy-950' : 'border-transparent text-stone-400'
              }`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step === s ? 'bg-navy-950 text-white' :
                  (step === 'images' && i === 0) || (step === 'review') ? 'bg-forest-600 text-white' : 'bg-stone-200 text-stone-500'
                }`}>
                  {(step === 'images' && i === 0) || (step === 'review' && i < 2) ? '✓' : i + 1}
                </div>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {error && <Alert message={error} className="mb-6" />}

        {/* Step 1: Details */}
        {step === 'details' && (
          <form onSubmit={handleSubmit(onDetailsSubmit)} noValidate>
            <div className="card p-6 mb-4">
              <h2 className="font-semibold text-navy-900 text-sm mb-5">Property details</h2>
              <div className="flex flex-col gap-5">
                <FormField label="Listing title" placeholder="e.g. Modern 3-bedroom apartment in Lekki Phase 1" required error={errors.title?.message} {...register('title')} />
                <div>
                  <label className="label">Description *</label>
                  <textarea
                    rows={4}
                    placeholder="Describe the property — location highlights, condition, unique features…"
                    className="input-field resize-none"
                    {...register('description')}
                  />
                  {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <SelectField label="Property type" options={typeOptions} required error={errors.propertyType?.message} {...register('propertyType')} />
                  <SelectField label="Country" options={countryOptions} placeholder="Select country" required error={errors.country?.message} {...register('country')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="City" placeholder="e.g. Lagos" required error={errors.city?.message} {...register('city')} />
                  <FormField label="Address" placeholder="Street address (optional)" error={errors.address?.message} {...register('address')} />
                </div>
              </div>
            </div>

            <div className="card p-6 mb-4">
              <h2 className="font-semibold text-navy-900 text-sm mb-5">Pricing</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <FormField label="Asking price" type="number" placeholder="0.00" required error={errors.price?.message} {...register('price', { valueAsNumber: true })} />
                </div>
                <SelectField label="Currency" options={currencyOptions} required error={errors.currency?.message} {...register('currency')} />
              </div>
            </div>

            <div className="card p-6 mb-6">
              <h2 className="font-semibold text-navy-900 text-sm mb-5">Property specs <span className="text-stone-400 font-normal">(optional)</span></h2>
              <div className="grid grid-cols-3 gap-4">
                <FormField label="Area (m²)" type="number" placeholder="e.g. 120" error={errors.areaSqm?.message} {...register('areaSqm', { valueAsNumber: true })} />
                <FormField label="Bedrooms" type="number" placeholder="e.g. 3" error={errors.bedrooms?.message} {...register('bedrooms', { valueAsNumber: true })} />
                <FormField label="Bathrooms" type="number" placeholder="e.g. 2" error={errors.bathrooms?.message} {...register('bathrooms', { valueAsNumber: true })} />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Save & continue to images →'}
            </button>
          </form>
        )}

        {/* Step 2: Images */}
        {step === 'images' && property && (
          <div>
            <div className="card p-6 mb-4">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-navy-900 text-sm">Property images</h2>
                <span className="text-xs text-stone-400">{images.length}/10 uploaded</span>
              </div>

              {/* Image grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {images.map((_, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden bg-stone-100 relative group">
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/properties/${property.id}/images/${i}`}
                        alt={`Image ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {i === 0 && (
                        <div className="absolute bottom-1 left-1 bg-navy-950/80 text-white text-[9px] px-1.5 py-0.5 rounded font-medium">Cover</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {images.length < 10 && (
                <>
                  <input ref={imageInputRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp" multiple onChange={handleImageUpload} disabled={uploading} />
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-stone-200 text-stone-400 hover:border-navy-300 hover:text-navy-600 hover:bg-navy-50/50 transition-colors disabled:cursor-not-allowed"
                  >
                    {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImagePlus className="w-6 h-6" />}
                    <p className="text-sm font-medium">{uploading ? 'Uploading…' : 'Click to add images'}</p>
                    <p className="text-xs">JPG, PNG, WEBP · Max 10MB each · First image is the cover</p>
                  </button>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('details')} className="btn-outline flex-1 py-3">← Back</button>
              <button
                onClick={() => setStep('review')}
                disabled={images.length === 0}
                className="btn-primary flex-2 py-3 flex-1"
              >
                {images.length === 0 ? 'Upload at least 1 image' : 'Review & submit →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 'review' && property && (
          <div>
            <div className="card p-6 mb-4">
              <div className="flex items-center gap-3 mb-5">
                <CheckCircle2 className="w-5 h-5 text-forest-600" />
                <h2 className="font-semibold text-navy-900 text-sm">Review your listing</h2>
              </div>

              {/* Preview image */}
              {images.length > 0 && (
                <div className="aspect-video rounded-xl overflow-hidden bg-stone-100 mb-5">
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/properties/${property.id}/images/0`}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-stone-400 uppercase tracking-wide mb-0.5">Title</p>
                  <p className="font-medium text-navy-900">{property.title}</p>
                </div>
                <div>
                  <p className="text-stone-400 uppercase tracking-wide mb-0.5">Type</p>
                  <p className="font-medium text-navy-900">{PROPERTY_TYPE_LABELS[property.propertyType]}</p>
                </div>
                <div>
                  <p className="text-stone-400 uppercase tracking-wide mb-0.5">Location</p>
                  <p className="font-medium text-navy-900">{property.city}, {property.country}</p>
                </div>
                <div>
                  <p className="text-stone-400 uppercase tracking-wide mb-0.5">Price</p>
                  <p className="font-bold text-navy-950 font-display">{new Intl.NumberFormat('en-US', { style: 'currency', currency: property.currency, maximumFractionDigits: 0 }).format(property.price)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-stone-400 uppercase tracking-wide mb-0.5">Images</p>
                  <p className="font-medium text-navy-900">{images.length} image{images.length !== 1 ? 's' : ''} uploaded</p>
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-stone-100">
                <p className="text-xs text-stone-400">
                  By submitting, your listing will be sent to our compliance team for review. It will go live once approved — typically within 1 business day.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('images')} className="btn-outline flex-1 py-3">← Back</button>
              <button onClick={handleSubmitListing} disabled={submitting} className="btn-gold flex-1 py-3">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : <><Send className="w-4 h-4" />Submit for review</>}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
