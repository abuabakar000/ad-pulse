import fs from 'fs';
import path from 'path';
import mongoose, { Schema, Document } from 'mongoose';

// -------------------------------------------------------------
// MongoDB Types & Interfaces
// -------------------------------------------------------------

export interface IClient {
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

export interface IMonthlyMetric {
  clientId: string;
  month: string; // YYYY-MM
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpa: number;
}

export interface IDailyMetric {
  clientId: string;
  date: string; // YYYY-MM-DD
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpa: number;
  channels: Record<string, {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpa: number;
  }>;
}

// Mongoose Schemas (Only compiled/initialized if MongoDB URI exists)
let ClientModel: mongoose.Model<IClient & Document> | null = null;
let MonthlyMetricModel: mongoose.Model<IMonthlyMetric & Document> | null = null;
let DailyMetricModel: mongoose.Model<IDailyMetric & Document> | null = null;

const MONGODB_URI = process.env.MONGODB_URI;

// Initialize connection and compile schemas
async function connectMongo() {
  if (!MONGODB_URI) return false;

  if (mongoose.connection.readyState >= 1) {
    return true;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    
    // Compile models if not already compiled
    if (!ClientModel) {
      const ClientSchema = new Schema({
        id: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        industry: { type: String, required: true },
        logoText: { type: String, required: true },
        primaryColor: { type: String, required: true },
        secondaryColor: { type: String, required: true },
        textColor: { type: String, required: true },
        conversionName: { type: String, required: true },
        targetCpa: { type: Number, required: true },
        channels: [{ type: String }]
      });
      ClientModel = mongoose.models.Client || mongoose.model<IClient & Document>('Client', ClientSchema);
    }

    if (!MonthlyMetricModel) {
      const MonthlyMetricSchema = new Schema({
        clientId: { type: String, required: true },
        month: { type: String, required: true },
        spend: { type: Number, required: true },
        impressions: { type: Number, required: true },
        clicks: { type: Number, required: true },
        conversions: { type: Number, required: true },
        ctr: { type: Number, required: true },
        cpa: { type: Number, required: true }
      });
      MonthlyMetricModel = mongoose.models.MonthlyMetric || mongoose.model<IMonthlyMetric & Document>('MonthlyMetric', MonthlyMetricSchema);
    }

    if (!DailyMetricModel) {
      const DailyMetricSchema = new Schema({
        clientId: { type: String, required: true },
        date: { type: String, required: true },
        spend: { type: Number, required: true },
        impressions: { type: Number, required: true },
        clicks: { type: Number, required: true },
        conversions: { type: Number, required: true },
        ctr: { type: Number, required: true },
        cpa: { type: Number, required: true },
        channels: { type: Map, of: Object }
      });
      DailyMetricModel = mongoose.models.DailyMetric || mongoose.model<IDailyMetric & Document>('DailyMetric', DailyMetricSchema);
    }

    // Seed database if empty
    await seedMongoIfEmpty();

    return true;
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    return false;
  }
}

// Local JSON Database Helper
function readLocalJSON() {
  const jsonPath = path.join(process.cwd(), 'src', 'data', 'mock_db.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Local JSON database file not found at ${jsonPath}. Run node src/data/seed.js to generate it.`);
  }
  const fileContent = fs.readFileSync(jsonPath, 'utf8');
  return JSON.parse(fileContent) as {
    clients: IClient[];
    monthlyMetrics: IMonthlyMetric[];
    dailyMetrics: IDailyMetric[];
  };
}

// Seed Mongo from local JSON if MongoDB is connected but empty
async function seedMongoIfEmpty() {
  if (!ClientModel || !MonthlyMetricModel || !DailyMetricModel) return;

  const count = await ClientModel.countDocuments();
  if (count === 0) {
    console.log("MongoDB is empty. Seeding from mock_db.json...");
    const localData = readLocalJSON();

    await ClientModel.insertMany(localData.clients);
    await MonthlyMetricModel.insertMany(localData.monthlyMetrics);
    await DailyMetricModel.insertMany(localData.dailyMetrics);
    console.log("MongoDB seeded successfully!");
  }
}

// -------------------------------------------------------------
// Database Query Interfaces
// -------------------------------------------------------------

export async function getClients(): Promise<IClient[]> {
  const isMongo = await connectMongo();
  
  if (isMongo && ClientModel) {
    const docs = await ClientModel.find({}).lean();
    return JSON.parse(JSON.stringify(docs)) as IClient[];
  } else {
    const data = readLocalJSON();
    return data.clients;
  }
}

export async function getClientById(id: string): Promise<IClient | null> {
  const isMongo = await connectMongo();
  
  if (isMongo && ClientModel) {
    const doc = await ClientModel.findOne({ id }).lean();
    if (!doc) return null;
    return JSON.parse(JSON.stringify(doc)) as IClient;
  } else {
    const data = readLocalJSON();
    return data.clients.find(c => c.id === id) || null;
  }
}

export async function getMonthlyMetrics(clientId: string): Promise<IMonthlyMetric[]> {
  const isMongo = await connectMongo();
  
  if (isMongo && MonthlyMetricModel) {
    const docs = await MonthlyMetricModel.find({ clientId }).sort({ month: 1 }).lean();
    return JSON.parse(JSON.stringify(docs)) as IMonthlyMetric[];
  } else {
    const data = readLocalJSON();
    return data.monthlyMetrics.filter(m => m.clientId === clientId);
  }
}

export async function getDailyMetrics(
  clientId: string, 
  startDateStr?: string, 
  endDateStr?: string
): Promise<IDailyMetric[]> {
  const isMongo = await connectMongo();
  let results: IDailyMetric[] = [];
  
  if (isMongo && DailyMetricModel) {
    const query: any = { clientId };
    if (startDateStr && endDateStr) {
      query.date = { $gte: startDateStr, $lte: endDateStr };
    } else if (startDateStr) {
      query.date = { $gte: startDateStr };
    } else if (endDateStr) {
      query.date = { $lte: endDateStr };
    }
    const docs = await DailyMetricModel.find(query).sort({ date: 1 }).lean();
    results = JSON.parse(JSON.stringify(docs)) as IDailyMetric[];
  } else {
    const data = readLocalJSON();
    let filtered = data.dailyMetrics.filter(m => m.clientId === clientId);
    
    if (startDateStr && endDateStr) {
      filtered = filtered.filter(m => m.date >= startDateStr && m.date <= endDateStr);
    }
    // Sort daily metrics by date ascending
    filtered.sort((a, b) => a.date.localeCompare(b.date));
    results = filtered;
  }
  return results;
}
