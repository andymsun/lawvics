'use client';

import Link from 'next/link';
import { InfiniteGridHero } from '@/components/ui/infinite-grid-hero';
import { ArrowRight, Sparkles } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

export default function Home() {
  return (
    <InfiniteGridHero>
      {/* Hero Content */}
      <div className="space-y-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-200/80 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 text-sm font-medium backdrop-blur-sm">
          <Sparkles className="w-4 h-4" />
          <span>AI-Powered Legal Research</span>
        </div>

        {/* Title */}
        <div className="mb-8 flex justify-center">
          <BrandLogo className="h-24 md:h-32 lg:h-40" />
        </div>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-[#0f172a]/80 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          The 50-State Survey.{' '}
          <span className="font-bold text-[#0f172a] dark:text-white underline decoration-[#0f172a]/20 dark:decoration-white/20 underline-offset-8">
            Done in 50 Seconds.
          </span>
        </p>

        {/* CTA Button */}
        <div className="pt-4">
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-[#0f172a] to-slate-800 dark:from-slate-600 dark:to-slate-500 rounded-full shadow-lg shadow-slate-500/20 hover:shadow-slate-500/40 hover:scale-105 transition-all duration-300"
          >
            <span>Launch Console</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Stats */}
        <div className="pt-8 flex items-center justify-center gap-8 text-sm text-[#0f172a]/60 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>50 Jurisdictions</span>
          </div>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-600" />
          <div>Parallel Processing</div>
          <div className="h-4 w-px bg-slate-300 dark:bg-slate-600" />
          <div>Real-time Verification</div>
        </div>
      </div>
    </InfiniteGridHero>
  );
}
