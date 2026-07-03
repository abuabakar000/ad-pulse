'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useApp } from '@/context/AppContext';

interface ChartsProps {
  data: any;
  loading: boolean;
}

export default function AnalyticsCharts({ data, loading }: ChartsProps) {
  const { role } = useApp();
  const [mounted, setMounted] = useState(false);

  // Prevent SSR hydration mismatch for Recharts
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
        <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 animate-pulse flex items-center justify-center">
          <div className="h-4 w-32 bg-neutral-900 rounded"></div>
        </div>
        <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 animate-pulse flex items-center justify-center">
          <div className="h-4 w-32 bg-neutral-900 rounded"></div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-neutral-950 border border-neutral-900 rounded-2xl p-6 h-[400px] animate-pulse flex flex-col justify-between">
          <div className="h-5 w-48 bg-neutral-900 rounded"></div>
          <div className="h-64 w-full bg-neutral-900/50 rounded-lg"></div>
        </div>
        <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 h-[400px] animate-pulse flex flex-col justify-between">
          <div className="h-5 w-32 bg-neutral-900 rounded"></div>
          <div className="h-64 w-full bg-neutral-900/50 rounded-lg"></div>
        </div>
      </div>
    );
  }

  const client = data?.client;
  const daily = data?.daily || [];
  const channels = data?.channels || [];
  const conversionName = client?.conversionName || 'Conversions';
  const brandColor = client?.primaryColor || '#db2777';

  // Format daily date strings for the chart labels (e.g. "Jun 15")
  const formattedDaily = daily.map((day: any) => {
    const dateObj = new Date(day.date);
    return {
      ...day,
      dateFormatted: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    };
  });

  // Theme colors for dark mode & channels
  const COLORS = [brandColor, '#0284c7', '#8b5cf6', '#f59e0b', '#10b981'];

  // Custom glassmorphic tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="pointer-events-none bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-800/50 p-4 rounded-xl shadow-xl text-xs">
          <p className="font-bold text-neutral-800 dark:text-neutral-200 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            const isSpend = entry.name.toLowerCase().includes('spend');
            const valueFormatted = isSpend 
              ? entry.value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
              : entry.value.toLocaleString('en-US');
            return (
              <p key={index} style={{ color: entry.color }} className="font-semibold flex justify-between gap-6 py-0.5">
                <span>{entry.name}:</span>
                <span>{valueFormatted}</span>
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Line Chart: Spend & Conversions Over Time */}
      <div className="lg:col-span-2 bg-neutral-950 border border-neutral-900 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-neutral-800 transition-all">
        <div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            Performance Trend
          </h3>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            {role === 'admin' ? `Daily ad budget spend correlated with total registered ${conversionName.toLowerCase()}` : `Daily registered campaign ${conversionName.toLowerCase()}`}
          </p>
        </div>
        
        <div className="h-[280px] w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedDaily} margin={{ top: 15, right: 30, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={brandColor} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={brandColor} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-grid, rgba(100, 100, 100, 0.08))" />
              <XAxis 
                dataKey="dateFormatted" 
                stroke="#888888" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
              />
              {role === 'admin' && (
                <YAxis 
                  yAxisId="left" 
                  stroke={brandColor} 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                  domain={[0, (max: number) => Math.ceil(max * 1.15)]}
                />
              )}
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#8b5cf6" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                domain={[0, (max: number) => Math.ceil(max * 1.15)]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              
              {role === 'admin' && (
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="spend" 
                  name="Ad Spend ($)" 
                  stroke={brandColor} 
                  strokeWidth={2.5} 
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              )}
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="conversions" 
                name={conversionName} 
                stroke="#8b5cf6" 
                strokeWidth={2.5} 
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Donut Chart: Traffic / Conversion Sources */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-neutral-800 transition-all">
        <div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            Acquisition Distribution
          </h3>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            Conversion share by digital marketing channel
          </p>
        </div>

        <div className="h-[220px] w-full mt-4 flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={channels}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="conversions"
              >
                {channels.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="stroke-white dark:stroke-neutral-900" strokeWidth={2} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          {/* Donut Center KPI */}
          <div className="absolute text-center">
            <span className="block text-xs font-medium text-neutral-400">Total</span>
            <span className="block text-2xl font-extrabold text-neutral-800 dark:text-white mt-0.5">
              {channels.reduce((acc: number, cur: any) => acc + cur.conversions, 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-2 mt-4">
          {channels.map((ch: any, idx: number) => {
            const totalConvs = channels.reduce((acc: number, cur: any) => acc + cur.conversions, 0);
            const percentage = totalConvs > 0 ? ((ch.conversions / totalConvs) * 100).toFixed(0) : 0;
            return (
              <div key={idx} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <div className="truncate text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  <span className="mr-1">{ch.name}</span>
                  <span className="text-neutral-400 font-normal">({percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Bar Chart: Channel Performance Summary */}
      <div className="lg:col-span-3 bg-neutral-950 border border-neutral-900 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-neutral-800 transition-all">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Channel Breakdown
            </h3>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              {role === 'admin' ? 'Comparing total ad investment vs volume generated by channel' : `Comparing total acquisition volume generated by channel`}
            </p>
          </div>
        </div>

        <div className="h-[280px] w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={channels} margin={{ top: 15, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-grid, rgba(100, 100, 100, 0.08))" />
              <XAxis 
                dataKey="name" 
                stroke="#888888" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
              />
              {role === 'admin' ? (
                <>
                  <YAxis 
                    yAxisId="left" 
                    stroke={brandColor} 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `$${val}`}
                    domain={[0, (max: number) => Math.ceil(max * 1.15)]}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#8b5cf6" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    domain={[0, (max: number) => Math.ceil(max * 1.15)]}
                  />
                </>
              ) : (
                <YAxis 
                  stroke="#8b5cf6" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  domain={[0, (max: number) => Math.ceil(max * 1.15)]}
                />
              )}
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              
              {role === 'admin' && (
                <Bar 
                  yAxisId="left" 
                  dataKey="spend" 
                  name="Spend ($)" 
                  fill={brandColor} 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={40}
                />
              )}
              <Bar 
                yAxisId={role === 'admin' ? 'right' : undefined} 
                dataKey="conversions" 
                name={conversionName} 
                fill="#8b5cf6" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
