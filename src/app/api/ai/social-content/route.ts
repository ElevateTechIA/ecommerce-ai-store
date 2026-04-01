import { NextRequest, NextResponse } from 'next/server';
import { featureFlags } from '@/lib/feature-flags';
import { generateContent } from '@/lib/agents/content/contentGenerator';

export async function POST(request: NextRequest) {
  if (!featureFlags.AI_ENABLED) {
    return NextResponse.json({ error: 'AI features are disabled' }, { status: 404 });
  }

  const body = await request.json();
  const { productName, productDescription, productPrice, productCategory, language = 'en', platforms = ['facebook', 'instagram'] } = body;

  try {
    const results: Record<string, string> = {};

    for (const platform of platforms) {
      const result = await generateContent({
        type: 'social-post',
        productName,
        productDescription,
        productPrice,
        productCategory,
        platform,
        language,
      });
      results[platform] = result.content.text;
    }

    return NextResponse.json({ posts: results });
  } catch (error) {
    console.error('Social content generation error:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 503 });
  }
}
