import { NextRequest, NextResponse } from 'next/server';
import { featureFlags } from '@/lib/feature-flags';
import { generateContent } from '@/lib/agents/content/contentGenerator';
import { getProducts } from '@/lib/db/products';

export async function POST(request: NextRequest) {
  if (!featureFlags.AI_ENABLED) {
    return NextResponse.json({ error: 'AI features are disabled' }, { status: 404 });
  }

  const body = await request.json();
  const { productId, language = 'en' } = body;

  try {
    const products = await getProducts();

    const result = await generateContent({
      type: 'product-recommendation',
      existingProducts: products.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category || 'General',
      })),
      userPreferences: productId ? [`Viewing product: ${productId}`] : [],
      language,
    });

    return NextResponse.json({
      recommendations: result.content.recommendations || [],
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json({ error: 'Recommendations unavailable' }, { status: 503 });
  }
}
