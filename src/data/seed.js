const fs = require('fs');
const path = require('path');

const clients = [
  {
    id: "bloom-skincare",
    name: "Bloom Skincare",
    industry: "E-commerce",
    logoText: "BS",
    primaryColor: "#be185d", // Rose 700
    secondaryColor: "#fdf2f8", // Rose 50
    textColor: "#9d174d", // Rose 800
    conversionName: "Orders",
    targetCpa: 22.00,
    channels: ["Meta Ads", "Google Ads", "Email"]
  },
  {
    id: "apex-fitness",
    name: "Apex Fitness",
    industry: "Health & Fitness",
    logoText: "AF",
    primaryColor: "#0284c7", // Sky 700
    secondaryColor: "#f0f9ff", // Sky 50
    textColor: "#0369a1", // Sky 800
    conversionName: "Memberships",
    targetCpa: 38.00,
    channels: ["Google Ads", "Meta Ads"]
  },
  {
    id: "nova-realty",
    name: "Nova Realty",
    industry: "Real Estate",
    logoText: "NR",
    primaryColor: "#047857", // Emerald 700
    secondaryColor: "#ecfdf5", // Emerald 50
    textColor: "#065f46", // Emerald 800
    conversionName: "Inquiries",
    targetCpa: 165.00,
    channels: ["Meta Ads", "Google Ads"]
  }
];

// Seed monthly data (April, May, June 2026)
const monthlyMetrics = [
  // Bloom Skincare
  {
    clientId: "bloom-skincare",
    month: "2026-04",
    spend: 4124.50,
    impressions: 105482,
    clicks: 3842,
    conversions: 182,
    ctr: 3.64,
    cpa: 22.66
  },
  {
    clientId: "bloom-skincare",
    month: "2026-05",
    spend: 4382.10,
    impressions: 112058,
    clicks: 4119,
    conversions: 201,
    ctr: 3.68,
    cpa: 21.80
  },
  {
    clientId: "bloom-skincare",
    month: "2026-06",
    spend: 4582.40,
    impressions: 121489,
    clicks: 4591,
    conversions: 228,
    ctr: 3.78,
    cpa: 20.10
  },
  // Apex Fitness
  {
    clientId: "apex-fitness",
    month: "2026-04",
    spend: 5842.00,
    impressions: 89450,
    clicks: 2981,
    conversions: 142,
    ctr: 3.33,
    cpa: 41.14
  },
  {
    clientId: "apex-fitness",
    month: "2026-05",
    spend: 6124.50,
    impressions: 92301,
    clicks: 3104,
    conversions: 155,
    ctr: 3.36,
    cpa: 39.51
  },
  {
    clientId: "apex-fitness",
    month: "2026-06",
    spend: 6500.20,
    impressions: 98124,
    clicks: 3429,
    conversions: 178,
    ctr: 3.49,
    cpa: 36.52
  },
  // Nova Realty
  {
    clientId: "nova-realty",
    month: "2026-04",
    spend: 8421.80,
    impressions: 64821,
    clicks: 1942,
    conversions: 48,
    ctr: 2.99,
    cpa: 175.45
  },
  {
    clientId: "nova-realty",
    month: "2026-05",
    spend: 8941.50,
    impressions: 71204,
    clicks: 2130,
    conversions: 54,
    ctr: 2.99,
    cpa: 165.58
  },
  {
    clientId: "nova-realty",
    month: "2026-06",
    spend: 9812.30,
    impressions: 78941,
    clicks: 2482,
    conversions: 63,
    ctr: 3.14,
    cpa: 155.75
  }
];

// Helper to generate dynamic daily metrics
const generateDailyMetrics = () => {
  const dailyMetrics = [];
  const startDate = new Date("2026-06-03");
  const endDate = new Date("2026-07-02");

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateString = d.toISOString().split('T')[0];

    clients.forEach(client => {
      let baseSpend, baseCtr, baseConvRate;

      if (client.id === "bloom-skincare") {
        baseSpend = 152;
        baseCtr = 0.0378;
        baseConvRate = 0.0496; // conversions per click
      } else if (client.id === "apex-fitness") {
        baseSpend = 216;
        baseCtr = 0.0349;
        baseConvRate = 0.0519;
      } else {
        baseSpend = 327;
        baseCtr = 0.0314;
        baseConvRate = 0.0253;
      }

      // Add pseudo-random variance (-15% to +20%)
      const variance = 0.85 + Math.random() * 0.35;
      const spend = parseFloat((baseSpend * variance).toFixed(2));
      
      const ctrVariance = 0.9 + Math.random() * 0.2;
      const ctr = baseCtr * ctrVariance;
      
      // Calculate impressions and clicks
      // Spend per click (CPC) variance
      const cpc = client.id === "bloom-skincare" ? 1.00 : client.id === "apex-fitness" ? 1.90 : 3.95;
      const cpcVariance = 0.95 + Math.random() * 0.1;
      const actualCpc = cpc * cpcVariance;
      
      const clicks = Math.round(spend / actualCpc);
      const impressions = Math.round(clicks / ctr);
      
      // Conversions
      const convVariance = 0.8 + Math.random() * 0.45;
      const conversions = Math.round(clicks * baseConvRate * convVariance);
      
      // Channel Breakdown
      const channelsBreakdown = {};
      let remainingSpend = spend;
      let remainingClicks = clicks;
      let remainingImpressions = impressions;
      let remainingConversions = conversions;

      client.channels.forEach((channel, idx) => {
        const isLast = idx === client.channels.length - 1;
        let share = 0.5; // Default share

        if (client.id === "bloom-skincare") {
          if (channel === "Meta Ads") share = 0.55;
          else if (channel === "Google Ads") share = 0.35;
          else share = 0.10;
        } else if (client.id === "apex-fitness") {
          if (channel === "Google Ads") share = 0.60;
          else share = 0.40;
        } else {
          if (channel === "Meta Ads") share = 0.70;
          else share = 0.30;
        }

        // Adjust share slightly
        const shareVariance = 0.9 + Math.random() * 0.2;
        const finalShare = isLast ? 1.0 : share * shareVariance;

        let channelSpend = isLast ? remainingSpend : parseFloat((spend * finalShare).toFixed(2));
        if (channelSpend > remainingSpend) channelSpend = remainingSpend;
        remainingSpend = parseFloat((remainingSpend - channelSpend).toFixed(2));

        // Let's model special case for Email: cheap spend, high clicks/convs
        let channelClicks, channelImpressions, channelConversions;
        if (channel === "Email") {
          channelSpend = parseFloat((5 + Math.random() * 5).toFixed(2)); // Email has very small cost
          channelClicks = Math.round(clicks * 0.15); // But gets good clicks
          channelImpressions = channelClicks * 10; // Open rate model
          channelConversions = Math.round(conversions * 0.18); // High conversion rate
        } else {
          channelClicks = isLast ? remainingClicks : Math.round(clicks * finalShare);
          if (channelClicks > remainingClicks) channelClicks = remainingClicks;
          remainingClicks -= channelClicks;

          channelImpressions = isLast ? remainingImpressions : Math.round(impressions * finalShare);
          if (channelImpressions > remainingImpressions) channelImpressions = remainingImpressions;
          remainingImpressions -= channelImpressions;

          channelConversions = isLast ? remainingConversions : Math.round(conversions * finalShare);
          if (channelConversions > remainingConversions) channelConversions = remainingConversions;
          remainingConversions -= channelConversions;
        }

        channelsBreakdown[channel] = {
          spend: channelSpend,
          impressions: channelImpressions,
          clicks: channelClicks,
          conversions: channelConversions,
          ctr: parseFloat(((channelClicks / Math.max(1, channelImpressions)) * 100).toFixed(2)),
          cpa: channelConversions > 0 ? parseFloat((channelSpend / channelConversions).toFixed(2)) : 0
        };
      });

      dailyMetrics.push({
        date: dateString,
        clientId: client.id,
        spend,
        impressions,
        clicks,
        conversions,
        ctr: parseFloat(((clicks / Math.max(1, impressions)) * 100).toFixed(2)),
        cpa: conversions > 0 ? parseFloat((spend / conversions).toFixed(2)) : 0,
        channels: channelsBreakdown
      });
    });
  }

  return dailyMetrics;
};

const dailyMetrics = generateDailyMetrics();

const dbData = {
  clients,
  monthlyMetrics,
  dailyMetrics
};

const dataDir = path.join(__dirname);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

fs.writeFileSync(
  path.join(dataDir, 'mock_db.json'),
  JSON.stringify(dbData, null, 2),
  'utf8'
);

console.log("Mock DB seeded successfully with 3 clients, monthly aggregates, and 30 days of daily campaign logs!");
