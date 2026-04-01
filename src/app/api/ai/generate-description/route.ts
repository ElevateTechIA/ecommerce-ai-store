import { NextRequest, NextResponse } from 'next/server';
import { featureFlags } from '@/lib/feature-flags';
import { generateContent } from '@/lib/agents/content/contentGenerator';

export async function POST(request: NextRequest) {
  if (!featureFlags.AI_ENABLED) {
    return NextResponse.json({ error: 'AI features are disabled' }, { status: 404 });
  }

  const body = await request.json();

  try {
    // Generate English description
    const enResult = await generateContent({
      type: 'product-description',
      productName: body.productName,
      productCategory: body.productCategory,
      keywords: body.keywords,
      tone: body.tone || 'professional',
      language: 'en',
    });

    // Generate Spanish description
    const esResult = await generateContent({
      type: 'product-description',
      productName: body.productName,
      productCategory: body.productCategory,
      keywords: body.keywords,
      tone: body.tone || 'professional',
      language: 'es',
    });

    return NextResponse.json({
      description: enResult.content.text,
      descriptionEs: esResult.content.text,
      alternates: enResult.content.alternates,
    });
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json({ error: 'AI generation failed' }, { status: 503 });
  }
}
