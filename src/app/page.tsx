'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Settings, 
  Layers, 
  Link2, 
  FileSpreadsheet, 
  Sun, 
  Moon, 
  Calendar, 
  ChevronDown, 
  CheckCircle2, 
  RefreshCw, 
  Lock, 
  Unlock, 
  Eye,
  Sliders,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import MetricCards from '@/components/MetricCards';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import AISummary from '@/components/AISummary';
import PDFReport from '@/components/PDFReport';

interface Client {
  id: string;
  name: string;
  industry: string;
  logoText: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  conversionName: string;
  targetCpa: number;
  channels: string[];
}

const renderClientLogo = (clientId: string, sizeClass = "h-3.5 w-3.5") => {
  if (clientId === 'bloom-skincare') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={sizeClass} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z" />
        <circle cx="12" cy="15" r="3" />
      </svg>
    );
  }
  if (clientId === 'apex-fitness') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={sizeClass} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3L2 20h20L12 3z" />
        <path d="M12 9l-6 10h12L12 9z" strokeWidth="1.2" className="opacity-60" />
      </svg>
    );
  }
  if (clientId === 'nova-realty') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={sizeClass} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M5 21V8l7-3 7 3v13M9 21v-6h6v6" />
      </svg>
    );
  }
  return null;
};

export default function Home() {
  const { theme, toggleTheme, role, setRole } = useApp();
  
  // App States
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [dateRange, setDateRange] = useState<string>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-06-15');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-06-30');
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'integrations'>('dashboard');
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [rawMetricsData, setRawMetricsData] = useState<any>(null);
  const [showSetup, setShowSetup] = useState(false);
  
  // Dynamic UI elements
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [aiSummaryText, setAiSummaryText] = useState('');
  const [aiRefreshCounter, setAiRefreshCounter] = useState(0);

  // Simulated active connections per channel
  const [connections, setConnections] = useState<Record<string, { connected: boolean; loading: boolean }>>({
    'Meta Ads': { connected: true, loading: false },
    'Google Ads': { connected: true, loading: false },
    'Email': { connected: true, loading: false }
  });

  // Fetch clients on mount
  useEffect(() => {
    async function loadClients() {
      try {
        const res = await fetch('/api/clients');
        if (res.ok) {
          const data = await res.json();
          setClients(data);
          if (data.length > 0) {
            setSelectedClient(data[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load clients", err);
      } finally {
        setLoadingClients(false);
      }
    }
    loadClients();
  }, []);

  // Fetch metrics data when client, date range, or custom dates change
  useEffect(() => {
    if (!selectedClient) return;

    async function loadMetrics() {
      setLoadingMetrics(true);
      
      // Simulate network latency (500ms) to show skeleton loaders (huge polish upgrade!)
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        let url = `/api/metrics?clientId=${selectedClient?.id}&range=${dateRange}`;
        if (dateRange === 'custom') {
          url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
        }
        
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setRawMetricsData(data);
        }
      } catch (err) {
        console.error("Failed to load metrics", err);
      } finally {
        setLoadingMetrics(false);
      }
    }
    loadMetrics();
  }, [selectedClient, dateRange, customStartDate, customEndDate]);

  // Recalculate metrics dynamically based on ACTIVE CONNECTIONS (Tab 2)
  // This is a premium touch: disconnecting a channel dynamically adjusts the dashboard numbers in real-time!
  const processedMetricsData = useMemo(() => {
    if (!rawMetricsData || !selectedClient) return null;

    // Filter channels that are currently marked as connected
    const activeChannels = Object.entries(connections)
      .filter(([_, status]) => status.connected)
      .map(([name]) => name);

    // If all channels are connected, return raw data directly
    const allClientChannelsConnected = selectedClient.channels.every(ch => activeChannels.includes(ch));
    if (allClientChannelsConnected) {
      return rawMetricsData;
    }

    // Otherwise, recalculate totals on the fly!
    const dailyFiltered = rawMetricsData.daily.map((day: any) => {
      let spend = 0;
      let impressions = 0;
      let clicks = 0;
      let conversions = 0;
      const dayChannels: any = {};

      if (day.channels) {
        Object.entries(day.channels).forEach(([chName, chData]: any) => {
          if (activeChannels.includes(chName)) {
            spend += chData.spend;
            impressions += chData.impressions;
            clicks += chData.clicks;
            conversions += chData.conversions;
            dayChannels[chName] = chData;
          }
        });
      }

      return {
        date: day.date,
        spend: parseFloat(spend.toFixed(2)),
        impressions,
        clicks,
        conversions,
        ctr: impressions > 0 ? parseFloat(((clicks / impressions) * 100).toFixed(2)) : 0,
        cpa: conversions > 0 ? parseFloat((spend / conversions).toFixed(2)) : 0,
        channels: dayChannels
      };
    });

    // Re-aggregate sums
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;

    dailyFiltered.forEach((day: any) => {
      totalSpend += day.spend;
      totalImpressions += day.impressions;
      totalClicks += day.clicks;
      totalConversions += day.conversions;
    });

    const currentCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const currentCpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
    const currentCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

    // Filter channel summary array
    const channelSummary = rawMetricsData.channels.filter((ch: any) => activeChannels.includes(ch.name));

    return {
      client: rawMetricsData.client,
      summary: {
        spend: parseFloat(totalSpend.toFixed(2)),
        impressions: totalImpressions,
        clicks: totalClicks,
        conversions: totalConversions,
        ctr: parseFloat(currentCtr.toFixed(2)),
        cpa: parseFloat(currentCpa.toFixed(2)),
        cpc: parseFloat(currentCpc.toFixed(2)),
        changes: rawMetricsData.summary.changes // keep trends simple
      },
      channels: channelSummary,
      funnel: [
        { stage: 'Impressions', value: totalImpressions, percentage: 100 },
        { stage: 'Clicks', value: totalClicks, percentage: totalImpressions > 0 ? parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0 },
        { stage: 'Conversions', value: totalConversions, percentage: totalClicks > 0 ? parseFloat(((totalConversions / totalClicks) * 100).toFixed(2)) : 0 }
      ],
      daily: dailyFiltered
    };
  }, [rawMetricsData, connections, selectedClient]);

  // Handle simulated integration connection toggles
  const handleToggleConnection = (channel: string) => {
    setConnections(prev => ({
      ...prev,
      [channel]: { ...prev[channel], loading: true }
    }));

    // Simulate API delay for connection sync
    setTimeout(() => {
      setConnections(prev => {
        const nextStatus = !prev[channel].connected;
        return {
          ...prev,
          [channel]: { connected: nextStatus, loading: false }
        };
      });
      // Force AI summary to regenerate based on new channel configuration
      setAiRefreshCounter(c => c + 1);
    }, 800);
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setIsClientDropdownOpen(false);
    
    // Initialize channel toggles for client channels
    const initialConnections: any = {};
    client.channels.forEach(ch => {
      initialConnections[ch] = { connected: true, loading: false };
    });
    setConnections(initialConnections);
  };

  // Human readable label for the date range (needed for PDF cover)
  const rangeLabel = useMemo(() => {
    if (dateRange === '7d') return 'June 26, 2026 - July 2, 2026 (Last 7 Days)';
    if (dateRange === '30d') return 'June 3, 2026 - July 2, 2026 (Last 30 Days)';
    return `${new Date(customStartDate).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' })} - ${new Date(customEndDate).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' })}`;
  }, [dateRange, customStartDate, customEndDate]);

  return (
    <div className="flex h-screen overflow-hidden bg-black font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="hidden md:flex flex-col w-64 bg-black border-r border-neutral-900 text-neutral-200">
        {/* Agency Logo header */}
        <div className="p-6 border-b border-neutral-900 flex items-center gap-3 select-none">
          <svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 flex-shrink-0 text-white">
            <path d="M3 12h3l3-9 6 18 3-9h3" />
          </svg>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-white tracking-tight">
              AdPulse
            </span>
            <span className="text-[10px] text-neutral-500 font-medium leading-none mt-1">
              Media Suite
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-950 dark:text-white'
                : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40 text-neutral-500 dark:text-neutral-400'
            }`}
          >
            <Activity className="h-4.5 w-4.5" />
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab('integrations')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'integrations'
                ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-950 dark:text-white'
                : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40 text-neutral-500 dark:text-neutral-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <Link2 className="h-4.5 w-4.5" />
              <span>Integrations</span>
            </div>
            {/* Pulsing indicator for active connections */}
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
            </span>
          </button>

          <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800/60 mt-6 px-4">
            <span className="block text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
              Control Panel
            </span>
          </div>

          {/* Role selector dropdown wrapper */}
          <div className="px-4 py-3 space-y-2">
            <label className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
              <Eye className="h-3 w-3" />
              View Role
            </label>
            <div className="grid grid-cols-2 bg-neutral-950 p-0.5 rounded-lg border border-neutral-900">
              <button
                onClick={() => setRole('admin')}
                className={`py-1 text-[11px] font-bold rounded cursor-pointer transition-all ${
                  role === 'admin' 
                    ? 'bg-neutral-800 text-white shadow-sm' 
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => setRole('client')}
                className={`py-1 text-[11px] font-bold rounded cursor-pointer transition-all ${
                  role === 'client' 
                    ? 'bg-neutral-800 text-white shadow-sm' 
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Client
              </button>
            </div>
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-normal">
              {role === 'admin' 
                ? 'Shows ad spends, margins, CPA, and setup settings.' 
                : 'Hides margins and internal ad budgets.'
              }
            </p>
          </div>
        </nav>

        {/* Sidebar Footer is removed (Theme toggle and version tag removed) */}
      </aside>

      {/* MAIN VIEW AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-black">
        
        {/* TOP BAR HEADER */}
        <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-neutral-900 px-6 py-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
          
          {/* Client Selector & Dropdown */}
          <div className="relative w-full sm:w-auto">
            {loadingClients ? (
              <div className="h-10 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
            ) : (
              <div>
                <button
                  onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                  className="w-full sm:w-60 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-neutral-900 bg-neutral-950 hover:border-neutral-850 cursor-pointer text-left shadow-sm transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span 
                      className="h-7 w-7 rounded-lg flex items-center justify-center bg-neutral-950 border border-neutral-900 flex-shrink-0 shadow-sm"
                      style={{ color: selectedClient?.primaryColor }}
                    >
                      {renderClientLogo(selectedClient?.id || '', "h-4 w-4")}
                    </span>
                    <div>
                      <span className="block text-xs font-bold text-white leading-tight">
                        {selectedClient?.name}
                      </span>
                      <span className="block text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                        {selectedClient?.industry}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-neutral-400" />
                </button>

                {/* Dropdown Menu */}
                {isClientDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-60 bg-neutral-950 border border-neutral-900 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-neutral-900 animate-fadeIn">
                    <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                      Switch Client Account
                    </div>
                    {clients.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleClientSelect(c)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-900 text-left transition-all cursor-pointer ${
                          selectedClient?.id === c.id ? 'bg-neutral-900 font-semibold' : ''
                        }`}
                      >
                        <span 
                          className="h-7 w-7 rounded-lg flex items-center justify-center bg-neutral-950 border border-neutral-900 flex-shrink-0 shadow-sm"
                          style={{ color: c.primaryColor }}
                        >
                          {renderClientLogo(c.id, "h-4 w-4")}
                        </span>
                        <div>
                          <span className="block text-xs font-bold text-neutral-900 dark:text-white leading-tight">{c.name}</span>
                          <span className="block text-[9px] text-neutral-400 font-medium uppercase">{c.industry}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Tools Header */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-start sm:justify-end">
            
            {/* Role indicator in Mobile */}
            <div className="md:hidden flex items-center bg-neutral-950 rounded-xl p-0.5 border border-neutral-900">
              <button 
                onClick={() => setRole(role === 'admin' ? 'client' : 'admin')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-neutral-300"
              >
                {role === 'admin' ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                <span>{role === 'admin' ? 'Admin View' : 'Client View'}</span>
              </button>
            </div>

            {/* Date range picker dropdown */}
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-900 bg-neutral-950 hover:border-neutral-850 cursor-pointer text-xs font-semibold text-neutral-300 shadow-sm outline-none transition-all appearance-none pr-8"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
              <Calendar className="absolute right-3 top-3.5 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
            </div>

            {/* Custom Date Inputs (Reveals if "custom" range is active) */}
            {dateRange === 'custom' && (
              <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-900 rounded-xl p-1.5 shadow-sm">
                <input
                  type="date"
                  value={customStartDate}
                  min="2026-06-03"
                  max="2026-07-02"
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-neutral-700 dark:text-neutral-300 outline-none p-1 cursor-pointer"
                />
                <span className="text-neutral-300 text-xs">-</span>
                <input
                  type="date"
                  value={customEndDate}
                  min="2026-06-03"
                  max="2026-07-02"
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-neutral-700 dark:text-neutral-300 outline-none p-1 cursor-pointer"
                />
              </div>
            )}

            {/* Branded PDF Export button */}
            {!loadingMetrics && processedMetricsData && (
              <PDFReport 
                data={processedMetricsData} 
                aiSummaryText={aiSummaryText}
                rangeText={rangeLabel}
              />
            )}
          </div>
        </header>

        {/* MAIN LAYOUT WRAPPER */}
        <div className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
          
          {/* TAB HEADERS FOR PROTOTYPE (Dashboard Overview vs Integrations setup) */}
          <div className="border-b border-neutral-900 flex gap-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`pb-4 text-sm font-bold tracking-wide relative cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'text-white'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Overview Dashboard
              {activeTab === 'dashboard' && (
                <span 
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" 
                  style={{ backgroundColor: selectedClient?.primaryColor || '#db2777' }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('integrations')}
              className={`pb-4 text-sm font-bold tracking-wide relative cursor-pointer ${
                activeTab === 'integrations'
                  ? 'text-white'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Data Connections
              {activeTab === 'integrations' && (
                <span 
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" 
                  style={{ backgroundColor: selectedClient?.primaryColor || '#db2777' }}
                />
              )}
            </button>
          </div>

          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Demo Sandbox Alert Banner */}
              <div className="bg-neutral-950 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-4 shadow-lg shadow-amber-500/5 relative overflow-hidden transition-all duration-300">
                <div className="absolute top-0 left-0 h-full w-1 bg-amber-500" />
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mt-0.5 flex-shrink-0">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="text-xs leading-normal w-full">
                  <span className="block font-bold text-neutral-200 mb-0.5">
                    Demo Sandbox Mode Active
                  </span>
                  <span className="block text-neutral-400">
                    The campaign metrics, AI summaries, and channel breakdowns shown here are dynamically simulated.
                  </span>
                  <button 
                    onClick={() => setShowSetup(!showSetup)}
                    className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 hover:text-amber-400 underline cursor-pointer transition-colors"
                  >
                    {showSetup ? "Hide 10-Second Setup Guide" : "🔌 Connect to Live Ads & Databases in 10 Seconds"}
                  </button>

                  {showSetup && (
                    <div className="mt-3 pt-3 border-t border-amber-500/10 text-[10px] font-mono text-neutral-400 space-y-2 bg-black/40 p-3 rounded-lg border border-neutral-900 animate-fadeIn">
                      <p className="font-semibold text-neutral-300">1. Create a <code className="text-amber-500 bg-neutral-900 px-1 py-0.5 rounded">.env.local</code> file in your project root.</p>
                      <p className="font-semibold text-neutral-300">2. Paste these keys to connect live data & AI models:</p>
                      <pre className="text-amber-500 bg-neutral-950 p-2.5 rounded border border-neutral-900 overflow-x-auto select-all leading-normal">
{`# 🔌 Live MongoDB Connection (Auto-Seeds on dev launch!)
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/adpulse"

# 🧠 Live AI Summaries (Gemini API)
GEMINI_API_KEY="AIzaSy..."`}
                      </pre>
                      <p className="text-neutral-500 leading-normal">That's it! Save the file, restart your dev server (<code className="text-amber-500 bg-neutral-900 px-1 py-0.5 rounded">npm run dev</code>), and the dashboard will instantly connect and seed itself.</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* TOP ROW: AI Generated plain-English Summary */}
              {selectedClient && (
                <AISummary 
                  clientId={selectedClient.id}
                  range={dateRange}
                  startDate={customStartDate}
                  endDate={customEndDate}
                  triggerRefresh={aiRefreshCounter}
                  onSummaryLoaded={(text) => setAiSummaryText(text)}
                />
              )}

              {/* MIDDLE ROW: 4-6 Key Stat Cards */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
                    Campaign KPI Performance
                  </h2>
                  <span className="text-xs text-neutral-400 font-medium">
                    Auto-synced
                  </span>
                </div>
                <MetricCards data={processedMetricsData} loading={loadingMetrics} />
              </div>

              {/* BOTTOM ROW: Performance Graphs & Breakdowns */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
                    Visual Analytics Breakdowns
                  </h2>
                </div>
                <AnalyticsCharts data={processedMetricsData} loading={loadingMetrics} />
              </div>

            </div>
          )}

          {/* TAB 2: DATA CONNECTIONS (INTEGRATIONS SIMULATION CONSOLE) */}
          {activeTab === 'integrations' && (
            <div className="space-y-6 max-w-3xl animate-fadeIn">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                  Client Data Source Integrations
                </h2>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                  Connect or simulate connecting your client's active ad accounts. Disconnecting an API below will automatically filter out that channel's budget and conversion metrics from the reporting dashboard.
                </p>
              </div>

              {selectedClient && (
                <div className="grid gap-4">
                  {selectedClient.channels.map((channel) => {
                    const status = connections[channel] || { connected: false, loading: false };
                    
                    let channelLogoBg = "bg-neutral-100 dark:bg-neutral-800 text-neutral-500";
                    let channelDesc = "";

                    if (channel === 'Meta Ads') {
                      channelLogoBg = "bg-blue-600/10 text-blue-500 border border-blue-500/10";
                      channelDesc = "Imports campaign spend, impressions, clicks, CVR, and catalog orders from Meta Business Suite Ads Manager.";
                    } else if (channel === 'Google Ads') {
                      channelLogoBg = "bg-amber-600/10 text-amber-500 border border-amber-500/10";
                      channelDesc = "Imports keyword performance, Google Search network budgets, CTR, and CPA conversions from Adwords API.";
                    } else if (channel === 'Email') {
                      channelLogoBg = "bg-purple-600/10 text-purple-500 border border-purple-500/10";
                      channelDesc = "Imports newsletter click-rates, sequence signups, list growths, and conversions from Mailchimp/Klaviyo API.";
                    }
                    return (
                      <div 
                        key={channel}
                        className="bg-neutral-950 border border-neutral-900 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:border-neutral-800"
                      >
                        <div className="flex items-start gap-4">
                          <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-neutral-950 border border-neutral-900 flex-shrink-0">
                            {channel === 'Meta Ads' && (
                              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-[#1877F2]">
                                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.8z"/>
                              </svg>
                            )}
                            {channel === 'Google Ads' && (
                              <svg viewBox="0 0 24 24" className="h-6 w-6">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.08H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.92l2.85-2.22.81-.6z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.08l3.66 2.84c.87-2.6 3.3-4.54 6.16-4.54z"/>
                              </svg>
                            )}
                            {channel === 'Email' && (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-purple-500">
                                <rect x="2" y="4" width="20" height="16" rx="3" />
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                              {channel}
                              {status.connected && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950/20 text-emerald-600">
                                  Connected
                                </span>
                              )}
                            </h3>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1 max-w-md leading-normal">
                              {channelDesc}
                            </p>
                          </div>
                        </div>

                        <div>
                          <button
                            onClick={() => handleToggleConnection(channel)}
                            disabled={status.loading}
                            className={`px-5 py-2 rounded-full text-xs font-bold cursor-pointer transition-all ${
                              status.connected
                                ? 'bg-transparent text-neutral-400 hover:text-red-500 border border-neutral-900 hover:border-red-900/50'
                                : 'bg-white hover:bg-neutral-200 text-black shadow-sm'
                            }`}
                          >
                            {status.loading ? (
                              <span className="flex items-center gap-1.5">
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                Syncing...
                              </span>
                            ) : status.connected ? (
                              'Disconnect'
                            ) : (
                              'Connect Account'
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Info panel */}
              <div className="bg-neutral-950 rounded-2xl p-6 border border-neutral-900 flex items-start gap-4">
                <Sliders className="h-5 w-5 text-neutral-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs leading-normal text-neutral-500">
                  <p className="font-bold text-neutral-300 mb-1">Portfolio Pitching Info</p>
                  This integrations console demonstrates to prospects that the application was built with modular campaign connections in mind. If you plug in real Facebook Graph APIs or Google Ads Client Libraries, the data shape mapped to our DB manager in <code className="bg-neutral-900 px-1 py-0.5 rounded text-[10px]">src/lib/db.ts</code> is identical, allowing a seamless production conversion.
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
