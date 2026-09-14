import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Auth layout: left panel is the brand statement, right panel is the form.
 * On mobile the brand panel collapses to a compact header.
 * Design direction: the brand panel uses Kleroge's deep forest green with
 * a subtle topographic map texture feel (via CSS gradient layers) — 
 * land, territory, ownership made visual.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-14 relative overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse at 20% 80%, rgba(23, 105, 61, 0.4) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(208, 157, 21, 0.15) 0%, transparent 50%),
            linear-gradient(160deg, #092618 0%, #13452b 40%, #17693d 100%)
          `,
        }}
      >
        {/* Subtle topographic lines overlay */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.04]"
          viewBox="0 0 400 600"
          preserveAspectRatio="xMidYMid slice"
        >
          {[30, 80, 130, 180, 230, 280, 330, 380, 430, 480].map((y, i) => (
            <ellipse
              key={i}
              cx="200"
              cy={y}
              rx={80 + i * 22}
              ry={18 + i * 5}
              fill="none"
              stroke="white"
              strokeWidth="1"
            />
          ))}
        </svg>

        {/* Logo */}
        <div className="relative z-10">
          <span className="font-display text-2xl font-semibold text-white tracking-tight">
            Kleroge
          </span>
        </div>

        {/* Brand statement */}
        <div className="relative z-10">
          <h1 className="font-display text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Where
            <br />
            Ownership
            <br />
            Begins.
          </h1>
          <p className="text-primary-200 text-base leading-relaxed max-w-xs">
            The digital infrastructure for property ownership.
            Discover, acquire, and own property — anywhere.
          </p>
        </div>

        {/* Footer stamp */}
        <div className="relative z-10">
          <p className="text-primary-400 text-xs">
            © {new Date().getFullYear()} Kleroge. All rights reserved.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col">
        {/* Mobile-only logo header */}
        <div className="lg:hidden flex items-center justify-between px-6 py-5 border-b border-surface-200">
          <span className="font-display text-xl font-semibold text-primary-800">Kleroge</span>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
