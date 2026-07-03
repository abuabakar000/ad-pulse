'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, BrainCircuit, RefreshCw, AlertCircle } from 'lucide-react';

interface AISummaryProps {
  clientId: string;
  range: string;
  startDate?: string;
  endDate?: string;
  triggerRefresh?: number; // External counter to trigger refetches
  onSummaryLoaded?: (summary: string) => void;
}

export default function AISummary({ 
  clientId, 
  range, 
  startDate, 
  endDate, 
  triggerRefresh = 0,
  onSummaryLoaded 
}: AISummaryProps) {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [typewriterText, setTypewriterText] = useState<string>('');

  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      setError('');
      setSummary('');
      setTypewriterText('');

      try {
        let url = `/api/ai-summary?clientId=${clientId}&range=${range}`;
        if (range === 'custom' && startDate && endDate) {
          url += `&startDate=${startDate}&endDate=${endDate}`;
        }

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error('Failed to fetch performance summary');
        }

        const data = await res.json();
        const text = data.summary || 'No summary generated.';
        setSummary(text);
        if (onSummaryLoaded) {
          onSummaryLoaded(text);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred while calling the AI layer.');
      } finally {
        setLoading(false);
      }
    }

    if (clientId) {
      fetchSummary();
    }
  }, [clientId, range, startDate, endDate, triggerRefresh]);

  // Micro-interaction: Typewriter effect when summary loads
  useEffect(() => {
    if (!summary || loading) return;

    let index = 0;
    const intervalId = setInterval(() => {
      setTypewriterText(prev => prev + summary.charAt(index));
      index++;
      if (index >= summary.length) {
        clearInterval(intervalId);
      }
    }, 4); // Fast, snappy typing animation

    return () => clearInterval(intervalId);
  }, [summary, loading]);

  return (
    <div className="relative overflow-hidden bg-neutral-950 border border-neutral-900 rounded-2xl p-6 text-white shadow-xl shadow-black">
      
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-gradient-to-br from-violet-600/25 to-pink-600/5 blur-3xl rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <BrainCircuit className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide uppercase text-neutral-400 flex items-center gap-1.5">
              Automated AI Summary
              <Sparkles className="h-3.5 w-3.5 text-violet-400 fill-violet-400/40" />
            </h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Natural Language Performance Analysis
            </p>
          </div>
        </div>
        
        {loading && (
          <span className="text-xs text-violet-400 font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/5 border border-violet-500/10">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Analyzing...
          </span>
        )}
      </div>

      {/* Content Body */}
      <div className="mt-4 min-h-[72px] flex items-center">
        {loading ? (
          <div className="w-full space-y-3">
            <div className="h-3 w-full bg-neutral-800/60 rounded animate-pulse"></div>
            <div className="h-3 w-5/6 bg-neutral-800/60 rounded animate-pulse"></div>
            <div className="h-3 w-4/5 bg-neutral-800/60 rounded animate-pulse"></div>
          </div>
        ) : error ? (
          <div className="flex items-start gap-2.5 text-red-400 text-xs py-2">
            <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        ) : (
          <p className="text-sm leading-relaxed font-normal text-neutral-200 antialiased select-text">
            {typewriterText}
            {typewriterText.length < summary.length && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-violet-400 animate-blink align-middle" />
            )}
          </p>
        )}
      </div>
    </div>
  );
}
