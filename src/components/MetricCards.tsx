'use client';

import React from 'react';
import { DollarSign, Eye, MousePointer, Target, Percent, Sparkles, TrendingUp, TrendingDown, Lock } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface Metric {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  color: string;
  isCurrency?: boolean;
  isPercentage?: boolean;
  reverseColor?: boolean; // If true, negative change is good (e.g., CPA)
  adminOnly?: boolean;
}

interface MetricCardsProps {
  data: any;
  loading: boolean;
}

export default function MetricCards({ data, loading }: MetricCardsProps) {
  const { role } = useApp();

  const client = data?.client;
  const summary = data?.summary;
  const changes = summary?.changes;

  const conversionName = client?.conversionName || 'Conversions';

  const metrics: Metric[] = [
    {
      title: 'Total Spend',
      value: summary?.spend ?? 0,
      change: changes?.spend ?? 0,
      icon: DollarSign,
      color: 'from-pink-500 to-rose-500',
      isCurrency: true,
      adminOnly: true,
    },
    {
      title: 'Impressions',
      value: summary?.impressions ?? 0,
      change: changes?.impressions ?? 0,
      icon: Eye,
      color: 'from-purple-500 to-indigo-500',
    },
    {
      title: 'Clicks',
      value: summary?.clicks ?? 0,
      change: changes?.clicks ?? 0,
      icon: MousePointer,
      color: 'from-blue-500 to-sky-500',
    },
    {
      title: conversionName,
      value: summary?.conversions ?? 0,
      change: changes?.conversions ?? 0,
      icon: Target,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      title: 'CTR',
      value: summary?.ctr ?? 0,
      change: changes?.ctr ?? 0,
      icon: Percent,
      color: 'from-amber-500 to-orange-500',
      isPercentage: true,
    },
    {
      title: 'Average CPA',
      value: summary?.cpa ?? 0,
      change: changes?.cpa ?? 0,
      icon: Sparkles,
      color: 'from-violet-500 to-purple-500',
      isCurrency: true,
      reverseColor: true,
      adminOnly: true,
    },
  ];

  const formatValue = (metric: Metric) => {
    if (metric.isCurrency) {
      return (metric.value as number).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    if (metric.isPercentage) {
      return `${(metric.value as number).toFixed(2)}%`;
    }
    return (metric.value as number).toLocaleString('en-US');
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-32 bg-neutral-950 border border-neutral-900 rounded-2xl p-6 flex flex-col justify-between animate-pulse"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
              <div className="h-8 w-8 bg-neutral-200 dark:bg-neutral-800 rounded-full"></div>
            </div>
            <div>
              <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded mb-2"></div>
              <div className="h-3 w-16 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {metrics.map((metric, index) => {
        const isLocked = metric.adminOnly && role === 'client';
        const Icon = metric.icon;
        
        // Determine coloring of changes
        const isPositive = metric.change >= 0;
        let trendColor = '';
        let TrendIcon = TrendingUp;

        if (metric.reverseColor) {
          // e.g. CPA: going down is good (-)
          trendColor = isPositive ? 'text-red-500 bg-red-50 dark:bg-red-950/20' : 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
          TrendIcon = isPositive ? TrendingUp : TrendingDown;
        } else {
          // e.g. Clicks/Convs: going up is good (+)
          trendColor = isPositive ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : 'text-red-500 bg-red-50 dark:bg-red-950/20';
          TrendIcon = isPositive ? TrendingUp : TrendingDown;
        }

        // Spend change is generally neutral grey unless extreme
        if (metric.title === 'Total Spend') {
          trendColor = 'text-neutral-500 bg-neutral-100 dark:text-neutral-400 dark:bg-neutral-800/40';
        }

        return (
          <div
            key={index}
            className="group relative overflow-hidden bg-neutral-950 border border-neutral-900 hover:border-neutral-800 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-black hover:-translate-y-0.5"
          >
            {/* Top Row */}
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                {metric.title}
              </span>
              <div className={`p-2 rounded-xl bg-gradient-to-br ${metric.color} text-white opacity-85 group-hover:opacity-100 transition-opacity`}>
                {isLocked ? <Lock className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
            </div>

            {/* Value & Change */}
            <div className="mt-4">
              {isLocked ? (
                <div>
                  <div className="text-xl font-bold tracking-tight text-neutral-400 dark:text-neutral-600 flex items-center gap-1.5 h-8">
                    <span>••••••</span>
                  </div>
                  <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-600 flex items-center gap-1 mt-1">
                    Admin View Only
                  </span>
                </div>
              ) : (
                <div>
                  <div className="text-lg sm:text-2xl font-bold tracking-tight text-white group-hover:text-neutral-200 transition-all">
                    {formatValue(metric)}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-semibold ${trendColor}`}>
                      <TrendIcon className="h-3 w-3" />
                      {Math.abs(metric.change)}%
                    </span>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">
                      vs last period
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Subtle glow border */}
            <div className="absolute inset-0 border border-transparent rounded-2xl group-hover:border-neutral-300/10 dark:group-hover:border-white/5 pointer-events-none" />
          </div>
        );
      })}
    </div>
  );
}
