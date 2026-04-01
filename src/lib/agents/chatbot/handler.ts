/**
 * Shopping Assistant Chatbot Handler
 */

import { searchKnowledgeBase } from './knowledgeBase';
import { classifyQuestion, getOffTopicResponse, sanitizeInput } from './questionClassifier';
import { SYSTEM_INSTRUCTION, buildPrompt, buildWelcomePrompt, validateResponse } from './promptTemplates';
import { checkRateLimit } from './rateLimiter';
import { getFlashModel } from '@/lib/integrations/gemini';
import { searchProducts } from '@/lib/db/products';
import { getOrder } from '@/lib/db/orders';
import { getProduct } from '@/lib/db/products';

const MAX_RESPONSE_LENGTH = 1000;

export interface ChatbotInput {
  message: string;
  language?: 'en' | 'es';
  clientId?: string;
}

export interface SuggestedProduct {
  id: string;
  title: string;
  price: number;
  imageUrl?: string | null;
}

export interface ChatbotResponse {
  success: boolean;
  response: string;
  source?: string;
  suggestedProducts?: SuggestedProduct[];
  metadata?: Record<string, any>;
  error?: string;
}

export async function handleChatbot(input: ChatbotInput): Promise<ChatbotResponse> {
  const { message, language = 'en', clientId = 'api-client' } = input;

  const rateLimitResult = checkRateLimit(clientId);
  if (!rateLimitResult.allowed) {
    return { success: false, response: 'Too many requests. Please wait a moment.', error: 'Rate limit' };
  }

  const sanitized = sanitizeInput(message);
  if (!sanitized) {
    return { success: false, response: 'Message cannot be empty.', error: 'Invalid input' };
  }

  const classification = classifyQuestion(sanitized);

  if (!classification.isAllowed) {
    return { success: true, response: getOffTopicResponse(), source: 'classification' };
  }

  // Greeting
  const greetings = ['hello', 'hi', 'hey', 'hola', 'buenos', 'buenas'];
  const isGreeting = greetings.some((g) => sanitized.toLowerCase().startsWith(g));

  if (isGreeting) {
    const model = getFlashModel();
    const langInst = language === 'es' ? '\nResponde en español.' : '\nRespond in English.';
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: buildWelcomePrompt() + langInst }] }],
      systemInstruction: { role: 'system', parts: [{ text: SYSTEM_INSTRUCTION }] },
    });
    return { success: true, response: result.response.text(), source: 'greeting' };
  }

  // Search knowledge base
  const knowledgeSections = searchKnowledgeBase(sanitized).slice(0, 3);

  // If asking about products, search the catalog
  let productResults: SuggestedProduct[] = [];
  if (classification.category === 'products') {
    const found = await searchProducts(sanitized);
    productResults = found.map((p) => ({
      id: p.id,
      title: language === 'es' && p.titleEs ? p.titleEs : p.title,
      price: p.price,
      imageUrl: p.imageUrl,
    }));
  }

  // If asking about an order, try to extract order ID and look it up
  let orderData: { id: string; status: string; totalAmount: number; productTitle: string } | null = null;
  if (classification.category === 'orders') {
    // Look for something that looks like a Firestore ID (alphanumeric, 20 chars)
    const idMatch = sanitized.match(/[a-zA-Z0-9]{15,}/);
    if (idMatch) {
      const order = await getOrder(idMatch[0]);
      if (order) {
        const product = await getProduct(order.productId);
        orderData = {
          id: order.id,
          status: order.status,
          totalAmount: order.totalAmount,
          productTitle: product ? (language === 'es' && product.titleEs ? product.titleEs : product.title) : 'Unknown',
        };
      }
    }
  }

  // Build prompt with all context
  const prompt = buildPrompt({
    userQuestion: sanitized,
    knowledgeSections,
    productResults: productResults.length > 0
      ? productResults.map((p) => ({ ...p, category: null, stock: 1 }))
      : undefined,
    orderData,
  });

  const langInst = language === 'es'
    ? '\n\nIMPORTANTE: Responde en español.'
    : '\n\nIMPORTANT: Respond in English.';

  const model = getFlashModel();
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt + langInst }] }],
    systemInstruction: { role: 'system', parts: [{ text: SYSTEM_INSTRUCTION }] },
  });

  let text = result.response.text();
  if (text.length > MAX_RESPONSE_LENGTH) {
    text = text.substring(0, MAX_RESPONSE_LENGTH) + '...';
  }

  const validation = validateResponse(text);
  if (!validation.isValid) {
    text = "I don't have that specific information. Let me know if I can help with something else!";
  }

  return {
    success: true,
    response: text,
    source: 'gemini',
    suggestedProducts: productResults.length > 0 ? productResults : undefined,
    metadata: { category: classification.category, confidence: classification.confidence },
  };
}
