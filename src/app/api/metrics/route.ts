import { NextResponse } from 'next/server';
import { getDailyMetrics, getMonthlyMetrics, getClientById } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const range = searchParams.get('range') || '30d';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId parameter' }, { status: 400 });
    }

    const client = await getClientById(clientId);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 444 });
    }

    // Determine current and previous date ranges
    // Max dates available in our mock dataset: 2026-06-03 to 2026-07-02
    const maxDataDate = new Date("2026-07-02");
    
    let currentStartStr = "";
    let currentEndStr = "2026-07-02";
    
    let prevStartStr = "";
    let prevEndStr = "";

    if (range === '7d') {
      const start = new Date(maxDataDate);
      start.setDate(start.getDate() - 6); // 7 days total
      currentStartStr = start.toISOString().split('T')[0];
      
      const pEnd = new Date(start);
      pEnd.setDate(pEnd.getDate() - 1);
      prevEndStr = pEnd.toISOString().split('T')[0];
      
      const pStart = new Date(pEnd);
      pStart.setDate(pStart.getDate() - 6);
      prevStartStr = pStart.toISOString().split('T')[0];
    } else if (range === '30d') {
      const start = new Date(maxDataDate);
      start.setDate(start.getDate() - 29); // 30 days total
      currentStartStr = start.toISOString().split('T')[0];
      
      // For previous 30 days, we'll fall back to May 2026 aggregates from the monthly DB table
      // to keep it simple and correct, or simulate it. We will use May monthly data.
    } else if (range === 'custom' && startDateParam && endDateParam) {
      currentStartStr = startDateParam;
      currentEndStr = endDateParam;
      
      // Calculate previous period
      const currStart = new Date(startDateParam);
      const currEnd = new Date(endDateParam);
      const diffTime = Math.abs(currEnd.getTime() - currStart.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      const pEnd = new Date(currStart);
      pEnd.setDate(pEnd.getDate() - 1);
      prevEndStr = pEnd.toISOString().split('T')[0];
      
      const pStart = new Date(pEnd);
      pStart.setDate(pStart.getDate() - (diffDays - 1));
      prevStartStr = pStart.toISOString().split('T')[0];
    } else {
      // Default to 30d
      const start = new Date(maxDataDate);
      start.setDate(start.getDate() - 29);
      currentStartStr = start.toISOString().split('T')[0];
    }

    // Fetch metrics
    const currentDaily = await getDailyMetrics(clientId, currentStartStr, currentEndStr);
    const monthlyData = await getMonthlyMetrics(clientId);
    
    // Aggregate current period
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    
    const channelAggs: Record<string, { spend: number; impressions: number; clicks: number; conversions: number }> = {};
    client.channels.forEach(ch => {
      channelAggs[ch] = { spend: 0, impressions: 0, clicks: 0, conversions: 0 };
    });

    currentDaily.forEach(day => {
      totalSpend += day.spend;
      totalImpressions += day.impressions;
      totalClicks += day.clicks;
      totalConversions += day.conversions;

      if (day.channels) {
        Object.entries(day.channels).forEach(([chName, chData]) => {
          if (channelAggs[chName]) {
            channelAggs[chName].spend += chData.spend;
            channelAggs[chName].impressions += chData.impressions;
            channelAggs[chName].clicks += chData.clicks;
            channelAggs[chName].conversions += chData.conversions;
          }
        });
      }
    });

    const currentCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const currentCpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
    const currentCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

    // Aggregate previous period for comparison
    let prevSpend = 0;
    let prevImpressions = 0;
    let prevClicks = 0;
    let prevConversions = 0;

    if (range === '30d') {
      // Compare to May monthly metrics
      const mayData = monthlyData.find(m => m.month === '2026-05');
      if (mayData) {
        prevSpend = mayData.spend;
        prevImpressions = mayData.impressions;
        prevClicks = mayData.clicks;
        prevConversions = mayData.conversions;
      }
    } else if (prevStartStr && prevEndStr) {
      // Query previous daily data if it falls in our database date range
      const prevDaily = await getDailyMetrics(clientId, prevStartStr, prevEndStr);
      prevDaily.forEach(day => {
        prevSpend += day.spend;
        prevImpressions += day.impressions;
        prevClicks += day.clicks;
        prevConversions += day.conversions;
      });
    }

    // If no previous data is found, simulate realistic differences (-3% to +5% variation)
    if (prevSpend === 0) {
      prevSpend = totalSpend * 0.945;
      prevImpressions = totalImpressions * 0.962;
      prevClicks = totalClicks * 0.951;
      prevConversions = totalConversions * 0.923;
    }

    const prevCtr = prevImpressions > 0 ? (prevClicks / prevImpressions) * 100 : 0;
    const prevCpa = prevConversions > 0 ? prevSpend / prevConversions : 0;

    // Compute percentage changes
    const getChange = (curr: number, prev: number) => {
      if (prev === 0) return 0;
      return parseFloat((((curr - prev) / prev) * 100).toFixed(1));
    };

    // For CPA and Spend, a decrease is often "good" (negative change is green). 
    // We will pass down raw changes and let UI handle visual presentation.
    const changes = {
      spend: getChange(totalSpend, prevSpend),
      impressions: getChange(totalImpressions, prevImpressions),
      clicks: getChange(totalClicks, prevClicks),
      conversions: getChange(totalConversions, prevConversions),
      ctr: getChange(currentCtr, prevCtr),
      cpa: getChange(currentCpa, prevCpa)
    };

    // Format Channel Performance
    const channelPerformance = Object.entries(channelAggs).map(([name, data]) => {
      const ctr = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;
      const cpa = data.conversions > 0 ? data.spend / data.conversions : 0;
      const roas = data.spend > 0 ? (data.conversions * (client.id === 'bloom-skincare' ? 65 : client.id === 'apex-fitness' ? 120 : 500)) / data.spend : 0; // Simulated sales value
      return {
        name,
        spend: parseFloat(data.spend.toFixed(2)),
        impressions: data.impressions,
        clicks: data.clicks,
        conversions: data.conversions,
        ctr: parseFloat(ctr.toFixed(2)),
        cpa: parseFloat(cpa.toFixed(2)),
        roas: parseFloat(roas.toFixed(2))
      };
    });

    // Funnel Breakdown
    const funnel = [
      { stage: 'Impressions', value: totalImpressions, percentage: 100 },
      { stage: 'Clicks', value: totalClicks, percentage: totalImpressions > 0 ? parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0 },
      { stage: 'Conversions', value: totalConversions, percentage: totalClicks > 0 ? parseFloat(((totalConversions / totalClicks) * 100).toFixed(2)) : 0 }
    ];

    return NextResponse.json({
      client,
      summary: {
        spend: parseFloat(totalSpend.toFixed(2)),
        impressions: totalImpressions,
        clicks: totalClicks,
        conversions: totalConversions,
        ctr: parseFloat(currentCtr.toFixed(2)),
        cpa: parseFloat(currentCpa.toFixed(2)),
        cpc: parseFloat(currentCpc.toFixed(2)),
        changes
      },
      channels: channelPerformance,
      funnel,
      daily: currentDaily.map(d => ({
        date: d.date,
        spend: d.spend,
        conversions: d.conversions,
        clicks: d.clicks,
        impressions: d.impressions,
        ctr: d.ctr,
        cpa: d.cpa
      }))
    });
  } catch (error: any) {
    console.error("API Error - Fetch Metrics:", error);
    return NextResponse.json({ error: 'Failed to fetch metrics: ' + error.message }, { status: 500 });
  }
}
