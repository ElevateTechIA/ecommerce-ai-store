import { NextResponse } from 'next/server';

const startTime = Date.now();

export async function GET() {
  const services: Record<string, string> = { gemini: 'unknown' };

  try {
    const { getFlashModel } = await import('@/lib/integrations/gemini');
    const model = getFlashModel();
    await model.generateContent('ping');
    services.gemini = 'connected';
  } catch {
    services.gemini = 'disconnected';
  }

  const allConnected = Object.values(services).every((s) => s === 'connected');

  return NextResponse.json({
    status: allConnected ? 'healthy' : 'degraded',
    version: '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    services,
  });
}
