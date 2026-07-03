import { NextResponse } from 'next/server';
import { getClients } from '@/lib/db';

export async function GET() {
  try {
    const clients = await getClients();
    return NextResponse.json(clients);
  } catch (error: any) {
    console.error("API Error - Fetch Clients:", error);
    return NextResponse.json({ error: 'Failed to fetch clients: ' + error.message }, { status: 500 });
  }
}
