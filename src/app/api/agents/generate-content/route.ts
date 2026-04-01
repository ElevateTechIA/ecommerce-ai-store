import { NextRequest, NextResponse } from 'next/server';
import { generateContent } from '@/lib/agents/content/contentGenerator';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type, input } = body;

  if (!type || !input) {
    return NextResponse.json(
      { success: false, error: 'Missing type and input' },
      { status: 400 }
    );
  }

  try {
    const result = await generateContent({ type, ...input });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Content generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Content generation failed' },
      { status: 500 }
    );
  }
}
