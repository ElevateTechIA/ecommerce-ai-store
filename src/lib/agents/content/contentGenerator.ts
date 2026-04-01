/**
 * Content Generator Agent
 *
 * Generates product descriptions, recommendations, and marketing copy.
 */

import { getFlashModel } from '@/lib/integrations/gemini';

export interface ContentInput {
  type: 'product-description' | 'product-recommendation' | 'marketing-copy' | 'social-post';
  productName?: string;
  productCategory?: string;
  productDescription?: string;
  productPrice?: number;
  keywords?: string[];
  tone?: 'professional' | 'casual' | 'luxury';
  language: 'en' | 'es';
  platform?: 'facebook' | 'instagram' | 'tiktok';
  existingProducts?: Array<{ id: string; title: string; category: string }>;
  userPreferences?: string[];
}

export interface ContentResult {
  success: boolean;
  content: {
    text: string;
    alternates?: string[];
    recommendations?: Array<{ productId: string; reason: string; score: number }>;
  };
  error?: string;
}

function buildDescriptionPrompt(input: ContentInput): string {
  const toneMap = {
    professional: 'Use a professional, authoritative tone.',
    casual: 'Use a casual, friendly, conversational tone.',
    luxury: 'Use an elegant, sophisticated, premium tone.',
  };
  const tone = toneMap[input.tone || 'professional'];
  const lang = input.language === 'es' ? 'Spanish' : 'English';

  return `Generate a compelling product description for an ecommerce store.

Product Name: ${input.productName || 'Unknown'}
Category: ${input.productCategory || 'General'}
Keywords: ${input.keywords?.join(', ') || 'none'}
${tone}

Write in ${lang}. Keep it 100-200 words. SEO-friendly. Focus on benefits.

You MUST return ONLY valid JSON with the actual generated descriptions (not placeholders). Format:
{"main": "your full generated description here", "alt1": "a different angle description", "alt2": "another angle description"}`;
}

function buildRecommendationPrompt(input: ContentInput): string {
  const lang = input.language === 'es' ? 'Spanish' : 'English';
  const products = input.existingProducts || [];

  return `Recommend products from this list based on user context.

Products:
${products.map((p) => `- ID: ${p.id}, Title: ${p.title}, Category: ${p.category}`).join('\n')}

User context: ${input.userPreferences?.join(', ') || 'browsing'}

Recommend up to 5. Write in ${lang}.
Return JSON: { "recommendations": [{ "productId": "id", "reason": "why", "score": 0.95 }] }`;
}

function buildSocialPostPrompt(input: ContentInput): string {
  const lang = input.language === 'es' ? 'Spanish' : 'English';
  const platformGuide: Record<string, string> = {
    facebook: 'Write a Facebook post: 2-3 sentences, benefit-focused, include a call-to-action to visit the store.',
    instagram: 'Write an Instagram caption: engaging hook, 3-5 relevant hashtags, use emojis naturally, include call-to-action.',
    tiktok: 'Write a short TikTok caption: catchy hook under 100 chars, 3 trending hashtags, casual tone.',
  };

  const guide = platformGuide[input.platform || 'facebook'] || platformGuide.facebook;

  return `Generate a social media post to promote a product.

Product: ${input.productName || 'Unknown'}
Category: ${input.productCategory || 'General'}
Price: $${input.productPrice || ''}
Description: ${input.productDescription || ''}

Platform: ${input.platform || 'facebook'}
${guide}

Write in ${lang}.

Return ONLY valid JSON:
{"post": "the full social media post text"}`;
}

function parseJson(text: string): any {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
  if (match) return JSON.parse(match[1].trim());
  return JSON.parse(text);
}

export async function generateContent(input: ContentInput): Promise<ContentResult> {
  const model = getFlashModel();

  const promptMap: Record<string, (i: ContentInput) => string> = {
    'product-description': buildDescriptionPrompt,
    'product-recommendation': buildRecommendationPrompt,
    'social-post': buildSocialPostPrompt,
    'marketing-copy': buildDescriptionPrompt,
  };
  const prompt = (promptMap[input.type] || buildDescriptionPrompt)(input);

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  try {
    const parsed = parseJson(responseText);

    if (input.type === 'product-recommendation') {
      return {
        success: true,
        content: { text: 'Recommendations generated', recommendations: parsed.recommendations },
      };
    }

    if (input.type === 'social-post') {
      return { success: true, content: { text: parsed.post || responseText } };
    }

    return {
      success: true,
      content: {
        text: parsed.main,
        alternates: [parsed.alt1, parsed.alt2].filter(Boolean),
      },
    };
  } catch {
    return { success: true, content: { text: responseText } };
  }
}
