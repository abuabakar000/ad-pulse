'use client';

import React, { useRef, useState } from 'react';
import { Download, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface PDFReportProps {
  data: any;
  aiSummaryText: string;
  rangeText: string;
}

export default function PDFReport({ data, aiSummaryText, rangeText }: PDFReportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  const reportRef1 = useRef<HTMLDivElement>(null);
  const reportRef2 = useRef<HTMLDivElement>(null);
  const reportRef3 = useRef<HTMLDivElement>(null);

  const client = data?.client;
  const summary = data?.summary;
  const channels = data?.channels || [];
  
  if (!client || !summary) return null;

  const brandColor = client.primaryColor || '#db2777';
  const conversionName = client.conversionName || 'Conversions';

  // Format helper functions
  const formatCurrency = (val: number) => {
    return val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };
  const formatNumber = (val: number) => {
    return val.toLocaleString('en-US');
  };

  const handleExport = async () => {
    setIsExporting(true);
    setStatusMessage('Preparing document...');

    try {
      // Dynamically import libraries at runtime to avoid SSR pre-rendering bugs and resolver wraps
      const jspdfModule = await import('jspdf');
      const html2canvasModule = await import('html2canvas');

      const ResolvedjsPDF = jspdfModule.jsPDF || (jspdfModule as any).default || jspdfModule;
      const Resolvedhtml2canvas = html2canvasModule.default || html2canvasModule;

      const pdf = new ResolvedjsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const refs = [reportRef1, reportRef2, reportRef3];
      
      for (let i = 0; i < refs.length; i++) {
        const ref = refs[i];
        if (!ref.current) continue;
        
        setStatusMessage(`Rendering page ${i + 1} of ${refs.length}...`);
        
        // Render element to canvas
        const canvas = await (Resolvedhtml2canvas as any)(ref.current, {
          scale: 2, // Double resolution for crystal-clear text & graphs
          useCORS: true,
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        if (i > 0) {
          pdf.addPage();
        }
        
        // A4 Dimensions: 210mm x 297mm
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }

      setStatusMessage('Saving PDF file...');
      pdf.save(`${client.name.replace(/\s+/g, '_')}_Performance_Report.pdf`);
      setStatusMessage('');
    } catch (error) {
      console.error('PDF Generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      {/* 1. Export Trigger Button */}
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider text-white border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ 
          borderColor: brandColor,
          backgroundColor: isExporting ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
          boxShadow: isExporting ? 'none' : `0 4px 14px 0 rgba(${brandColor.startsWith('#') ? parseInt(brandColor.slice(1,3),16) : 219}, ${brandColor.startsWith('#') ? parseInt(brandColor.slice(3,5),16) : 39}, ${brandColor.startsWith('#') ? parseInt(brandColor.slice(5,7),16) : 119}, 0.15)`
        }}
        onMouseEnter={(e) => {
          if (!isExporting) {
            e.currentTarget.style.backgroundColor = brandColor;
            e.currentTarget.style.boxShadow = `0 6px 20px 0 rgba(${brandColor.startsWith('#') ? parseInt(brandColor.slice(1,3),16) : 219}, ${brandColor.startsWith('#') ? parseInt(brandColor.slice(3,5),16) : 39}, ${brandColor.startsWith('#') ? parseInt(brandColor.slice(5,7),16) : 119}, 0.35)`;
          }
        }}
        onMouseLeave={(e) => {
          if (!isExporting) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.boxShadow = `0 4px 14px 0 rgba(${brandColor.startsWith('#') ? parseInt(brandColor.slice(1,3),16) : 219}, ${brandColor.startsWith('#') ? parseInt(brandColor.slice(3,5),16) : 39}, ${brandColor.startsWith('#') ? parseInt(brandColor.slice(5,7),16) : 119}, 0.15)`;
          }
        }}
      >
        {isExporting ? (
          <>
            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>{statusMessage || 'Exporting...'}</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            <span>Export PDF Report</span>
          </>
        )}
      </button>

      {/* 2. Hidden PDF Templates (A4 Layout Container positioned at 0,0 but layered behind and transparent) */}
      <div 
        className="fixed top-0 left-0 pointer-events-none select-none" 
        style={{ zIndex: -9999, opacity: 0.01 }}
      >
        
        {/* PAGE 1: COVER PAGE */}
        <div 
          ref={reportRef1} 
          className="w-[794px] h-[1123px] bg-white p-16 flex flex-col justify-between text-neutral-900 border border-neutral-100 relative overflow-hidden"
          style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}
        >
          {/* Cover decorative background accents */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-10 blur-3xl pointer-events-none" style={{ backgroundColor: brandColor }} />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full opacity-5 blur-3xl pointer-events-none" style={{ backgroundColor: '#6366f1' }} />
          
          {/* Header branding */}
          <div className="flex justify-between items-center border-b border-neutral-100 pb-6">
            <span className="text-xs font-bold tracking-widest text-neutral-400 uppercase">AdPulse Marketing Solutions</span>
            <div className="h-6 w-6 rounded bg-neutral-900 flex items-center justify-center text-white text-[10px] font-extrabold">AP</div>
          </div>

          {/* Main Title Block */}
          <div className="my-auto space-y-8">
            <div 
              className="w-16 h-2.5 rounded-full" 
              style={{ backgroundColor: brandColor }} 
            />
            <div className="space-y-4">
              <h1 className="text-5xl font-black tracking-tight text-neutral-900 leading-tight">
                Campaign <br/>Performance <br/>Report
              </h1>
              <p className="text-lg text-neutral-500 font-medium">
                Comprehensive analytics, KPI analysis and strategic insights.
              </p>
            </div>
            
            {/* Metadata Box */}
            <div className="pt-12 grid grid-cols-2 gap-8 border-t border-neutral-100 max-w-lg">
              <div>
                <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Client Profile</span>
                <span className="block text-md font-bold text-neutral-800 mt-1">{client.name}</span>
                <span className="block text-xs text-neutral-500 mt-0.5">{client.industry}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Reporting Period</span>
                <span className="block text-md font-bold text-neutral-800 mt-1">{rangeText}</span>
                <span className="block text-xs text-neutral-500 mt-0.5">Automated Sync</span>
              </div>
            </div>
          </div>

          {/* Footer branding */}
          <div className="flex justify-between items-end text-neutral-400 text-xs border-t border-neutral-100 pt-8">
            <div>
              <p className="font-bold text-neutral-800">Generated Automatically</p>
              <p className="text-[10px] mt-0.5">Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <p className="text-[10px] font-medium tracking-wide uppercase">Private & Confidential</p>
          </div>
        </div>

        {/* PAGE 2: EXECUTIVE SUMMARY & KPIS */}
        <div 
          ref={reportRef2} 
          className="w-[794px] h-[1123px] bg-white p-16 flex flex-col justify-between text-neutral-900 border border-neutral-100 relative"
          style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}
        >
          {/* Layout Top */}
          <div className="space-y-8">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">01. Executive Summary & KPIs</span>
              <span className="text-xs text-neutral-400">{client.name} | Report</span>
            </div>

            {/* AI Summary Block */}
            <div className="bg-neutral-50 rounded-2xl p-8 border border-neutral-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-neutral-900">
                <FileText className="h-24 w-24" />
              </div>
              <h3 className="text-xs font-bold tracking-widest text-neutral-400 uppercase mb-3 flex items-center gap-1.5">
                Executive Insights
              </h3>
              <p className="text-sm leading-relaxed text-neutral-700 font-normal select-text">
                {aiSummaryText || "For this reporting period, performance metrics remained solid. Direct ad channels continue to drive the core of consumer engagement, establishing a reliable acquisition trajectory."}
              </p>
            </div>

            {/* KPI grid */}
            <div>
              <h3 className="text-xs font-bold tracking-widest text-neutral-400 uppercase mb-4">
                Core Performance Metrics
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {/* Spend */}
                <div className="p-5 border border-neutral-100 rounded-xl bg-white shadow-sm">
                  <span className="block text-[10px] font-bold text-neutral-400 uppercase">Total Spend</span>
                  <span className="block text-xl font-bold text-neutral-900 mt-1">{formatCurrency(summary.spend)}</span>
                  <span className={`inline-flex items-center gap-0.5 text-xs font-semibold mt-2 px-1.5 py-0.5 rounded ${summary.changes?.spend >= 0 ? 'text-neutral-600 bg-neutral-50' : 'text-neutral-600 bg-neutral-50'}`}>
                    {summary.changes?.spend >= 0 ? '+' : ''}{summary.changes?.spend}%
                  </span>
                </div>
                
                {/* Conversions */}
                <div className="p-5 border border-neutral-100 rounded-xl bg-white shadow-sm">
                  <span className="block text-[10px] font-bold text-neutral-400 uppercase">Total {conversionName}</span>
                  <span className="block text-xl font-bold text-neutral-900 mt-1">{formatNumber(summary.conversions)}</span>
                  <span className={`inline-flex items-center gap-0.5 text-xs font-semibold mt-2 px-1.5 py-0.5 rounded ${summary.changes?.conversions >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                    {summary.changes?.conversions >= 0 ? '+' : ''}{summary.changes?.conversions}%
                  </span>
                </div>

                {/* CPA */}
                <div className="p-5 border border-neutral-100 rounded-xl bg-white shadow-sm">
                  <span className="block text-[10px] font-bold text-neutral-400 uppercase">Average CPA</span>
                  <span className="block text-xl font-bold text-neutral-900 mt-1">{formatCurrency(summary.cpa)}</span>
                  <span className={`inline-flex items-center gap-0.5 text-xs font-semibold mt-2 px-1.5 py-0.5 rounded ${summary.changes?.cpa <= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                    {summary.changes?.cpa >= 0 ? '+' : ''}{summary.changes?.cpa}%
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed Table */}
            <div>
              <h3 className="text-xs font-bold tracking-widest text-neutral-400 uppercase mb-4">
                Performance Scorecard
              </h3>
              <table className="w-full text-left text-xs border border-neutral-100 rounded-lg overflow-hidden">
                <thead className="bg-neutral-50 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-100">
                  <tr>
                    <th className="px-5 py-3.5">Metric Indicator</th>
                    <th className="px-5 py-3.5 text-right">Value</th>
                    <th className="px-5 py-3.5 text-right">Change %</th>
                    <th className="px-5 py-3.5 text-right">Target Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                  <tr>
                    <td className="px-5 py-4 font-bold text-neutral-800">Impressions</td>
                    <td className="px-5 py-4 text-right font-semibold">{formatNumber(summary.impressions)}</td>
                    <td className={`px-5 py-4 text-right font-bold ${summary.changes?.impressions >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {summary.changes?.impressions >= 0 ? '+' : ''}{summary.changes?.impressions}%
                    </td>
                    <td className="px-5 py-4 text-right"><span className="text-[10px] bg-neutral-100 px-2 py-0.5 rounded-full font-bold text-neutral-500 uppercase">Steady</span></td>
                  </tr>
                  <tr>
                    <td className="px-5 py-4 font-bold text-neutral-800">Clicks</td>
                    <td className="px-5 py-4 text-right font-semibold">{formatNumber(summary.clicks)}</td>
                    <td className={`px-5 py-4 text-right font-bold ${summary.changes?.clicks >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {summary.changes?.clicks >= 0 ? '+' : ''}{summary.changes?.clicks}%
                    </td>
                    <td className="px-5 py-4 text-right"><span className="text-[10px] bg-neutral-100 px-2 py-0.5 rounded-full font-bold text-neutral-500 uppercase">Steady</span></td>
                  </tr>
                  <tr>
                    <td className="px-5 py-4 font-bold text-neutral-800">Click-Through Rate (CTR)</td>
                    <td className="px-5 py-4 text-right font-semibold">{summary.ctr}%</td>
                    <td className={`px-5 py-4 text-right font-bold ${summary.changes?.ctr >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {summary.changes?.ctr >= 0 ? '+' : ''}{summary.changes?.ctr}%
                    </td>
                    <td className="px-5 py-4 text-right">
                      {summary.ctr >= 3.0 ? (
                        <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded-full font-bold text-emerald-700 uppercase">Optimal</span>
                      ) : (
                        <span className="text-[10px] bg-amber-100 px-2 py-0.5 rounded-full font-bold text-amber-700 uppercase">Average</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-5 py-4 font-bold text-neutral-800">Cost Per Acquisition (CPA)</td>
                    <td className="px-5 py-4 text-right font-semibold">{formatCurrency(summary.cpa)}</td>
                    <td className={`px-5 py-4 text-right font-bold ${summary.changes?.cpa <= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {summary.changes?.cpa >= 0 ? '+' : ''}{summary.changes?.cpa}%
                    </td>
                    <td className="px-5 py-4 text-right">
                      {summary.cpa <= client.targetCpa ? (
                        <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded-full font-bold text-emerald-700 uppercase">Below Target</span>
                      ) : (
                        <span className="text-[10px] bg-red-100 px-2 py-0.5 rounded-full font-bold text-red-700 uppercase">Over Target</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Layout Footer */}
          <div className="flex justify-between items-center text-[10px] text-neutral-400 border-t border-neutral-100 pt-6">
            <span>Executive Performance Summary</span>
            <span>Page 2</span>
          </div>
        </div>

        {/* PAGE 3: CHANNEL BREAKDOWN & EXPLANATION */}
        <div 
          ref={reportRef3} 
          className="w-[794px] h-[1123px] bg-white p-16 flex flex-col justify-between text-neutral-900 border border-neutral-100 relative"
          style={{ fontFamily: 'var(--font-geist-sans), sans-serif' }}
        >
          <div className="space-y-8">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">02. Channel-Level Analysis</span>
              <span className="text-xs text-neutral-400">{client.name} | Report</span>
            </div>

            {/* Channels Table */}
            <div>
              <h3 className="text-xs font-bold tracking-widest text-neutral-400 uppercase mb-4">
                Detailed Performance by Marketing Channel
              </h3>
              <table className="w-full text-left text-xs border border-neutral-100 rounded-lg overflow-hidden">
                <thead className="bg-neutral-50 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-100">
                  <tr>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-4 py-3 text-right">Spend</th>
                    <th className="px-4 py-3 text-right">Impressions</th>
                    <th className="px-4 py-3 text-right">Clicks</th>
                    <th className="px-4 py-3 text-right">{conversionName}</th>
                    <th className="px-4 py-3 text-right">CTR</th>
                    <th className="px-4 py-3 text-right">CPA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                  {channels.map((ch: any, i: number) => (
                    <tr key={i}>
                      <td className="px-4 py-4 font-bold text-neutral-800">{ch.name}</td>
                      <td className="px-4 py-4 text-right font-medium">{formatCurrency(ch.spend)}</td>
                      <td className="px-4 py-4 text-right">{formatNumber(ch.impressions)}</td>
                      <td className="px-4 py-4 text-right">{formatNumber(ch.clicks)}</td>
                      <td className="px-4 py-4 text-right font-semibold">{formatNumber(ch.conversions)}</td>
                      <td className="px-4 py-4 text-right">{ch.ctr}%</td>
                      <td className="px-4 py-4 text-right font-bold" style={{ color: brandColor }}>{formatCurrency(ch.cpa)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Channels visual graphics simulation (simple bar elements) */}
            <div>
              <h3 className="text-xs font-bold tracking-widest text-neutral-400 uppercase mb-4">
                Acquisition Volume Visual Breakdown
              </h3>
              <div className="space-y-4">
                {channels.map((ch: any, i: number) => {
                  const maxConvs = Math.max(...channels.map((c: any) => c.conversions));
                  const widthPercent = maxConvs > 0 ? (ch.conversions / maxConvs) * 100 : 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-neutral-700">{ch.name}</span>
                        <span className="font-bold text-neutral-900">{ch.conversions} {conversionName} ({ch.ctr}% CTR)</span>
                      </div>
                      <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${widthPercent}%`,
                            backgroundColor: brandColor
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tactical recommendations */}
            <div className="space-y-3 pt-6 border-t border-neutral-100">
              <h3 className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
                AdPulse Tactical Recommendations
              </h3>
              <div className="grid grid-cols-1 gap-3 text-xs leading-relaxed text-neutral-600">
                <div className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p><strong>Optimize Budget Distribution:</strong> Consolidate Meta budgets to core campaign nodes that generate conversion CPA efficiency, minimizing peripheral ad set testing overlay.</p>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p><strong>Keyword Refinement:</strong> Audit search terms weekly to block rising-CPA keywords and redirect those impressions to high-intent localized match keywords.</p>
                </div>
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p><strong>Creative Freshness:</strong> CTR decay indicates potential creative saturation. Plan a fresh creative flight of asset updates for social campaigns in the next 15 days.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] text-neutral-400 border-t border-neutral-100 pt-6">
            <span>Channel Analytics & Recommendations</span>
            <span>Page 3</span>
          </div>
        </div>

      </div>
    </div>
  );
}
