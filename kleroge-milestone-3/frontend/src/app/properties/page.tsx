'use client';

import { useEffect, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Spinner } from '@/components/ui/Spinner';
import { Property, getApprovedListings } from '@/lib/properties';
import { SUPPORTED_COUNTRIES } from '@/types';

const typeOptions = [
  { value: '', label: 'All types' },
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'land', label: 'Land' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'mixed_use', label: 'Mixed Use' },
];

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const results = await getApprovedListings({ country: country || undefined, city: city || undefined, type: type || undefined });
      setProperties(results);
    } catch { setProperties([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      {/* Hero */}
      <div className="bg-navy-950">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <p className="text-gold-400 text-xs font-semibold uppercase tracking-[0.2em] mb-3">Global listings</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">Find your next property</h1>
          <p className="text-navy-300 text-sm mb-8">Verified listings across borders. Own anywhere.</p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search by city…"
                value={city}
                onChange={e => setCity(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && load()}
                className="w-full pl-10 pr-4 py-3 rounded-lg text-sm bg-white border-0 text-navy-950 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-gold-400"
              />
            </div>
            <button onClick={load} className="btn-gold px-6 py-3">Search</button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-stone-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3 overflow-x-auto">
          <SlidersHorizontal className="w-4 h-4 text-stone-400 shrink-0" />
          <select value={country} onChange={e => setCountry(e.target.value)} className="text-xs border border-stone-200 rounded-lg px-3 py-1.5 bg-white text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-400">
            <option value="">All countries</option>
            {SUPPORTED_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
          <select value={type} onChange={e => setType(e.target.value)} className="text-xs border border-stone-200 rounded-lg px-3 py-1.5 bg-white text-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-400">
            {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={load} className="btn-primary text-xs px-4 py-1.5 ml-auto shrink-0">Apply filters</button>
        </div>
      </div>

      {/* Results */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Spinner size="lg" className="text-navy-700" />
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-stone-400" />
            </div>
            <h2 className="font-display text-xl font-bold text-navy-900 mb-2">No listings found</h2>
            <p className="text-stone-400 text-sm">Try adjusting your filters or check back soon as new listings go live daily.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-stone-400 mb-6">{properties.length} listing{properties.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {properties.map(p => <PropertyCard key={p.id} property={p} />)}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
