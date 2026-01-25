'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { InfiniteGridHero } from '@/components/ui/infinite-grid-hero';
import { ArrowRight, Sparkles } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { AnimatePresence, motion } from 'framer-motion';

const PROMPTS = [
  "Statute of limitations for fraud...",
  "Grand theft felony thresholds...",
  "Adverse possession time limits...",
  "LLC annual report deadlines...",
  "Remote notary requirements...",
  "Wrongful death claim limits..."
];

export default function Home() {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PROMPTS.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

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
          500,000 Statutes.{' '}
          <span className="font-semibold text-[#0f172a] dark:text-slate-200">
            50 States.
          </span>{' '}
          <span className="font-bold text-[#0f172a] dark:text-white underline decoration-[#0f172a]/20 dark:decoration-white/20 underline-offset-8">
            Under 5 Minutes.
          </span>
        </p>

        {/* CTA Search Input */}
        <div className="pt-8 w-full max-w-xl mx-auto px-4 relative z-10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const input = form.elements.namedItem('query') as HTMLInputElement;
              // Encode strictly to ensure special chars traverse correctly
              const q = encodeURIComponent(input.value.trim());
              // Use window.location to ensure full navigation if needed, or Next Link equivalent logic
              if (q) {
                window.location.href = `/dashboard?q=${q}`;
              } else {
                window.location.href = '/dashboard';
              }
            }}
            className="relative group"
          >
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none z-10">
              <Sparkles className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>

            <input
              name="query"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full pl-14 pr-16 py-5 text-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-slate-900 dark:text-white placeholder:text-slate-400"
            />

            {/* Custom Fading Placeholder - Must be after input to show on top of background */}
            <div className="absolute inset-0 pl-14 pr-16 py-5 pointer-events-none overflow-hidden flex items-center z-10">
              <AnimatePresence mode="wait">
                {!inputValue && (
                  <motion.span
                    key={placeholderIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="text-lg text-slate-400 truncate w-full"
                  >
                    {PROMPTS[placeholderIndex]}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-[#0f172a] dark:bg-blue-600 text-white rounded-xl hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg z-20"
              aria-label="Search"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>
          <div className="mt-4 text-center">
            <Link href="/dashboard" className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
              Skip to Dashboard &rarr;
            </Link>
          </div>
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
