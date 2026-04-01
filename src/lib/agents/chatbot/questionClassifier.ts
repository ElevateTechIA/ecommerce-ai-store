/**
 * Ecommerce Question Classifier
 */

export type QuestionCategory = 'products' | 'orders' | 'shipping' | 'returns' | 'payments' | 'store-info';

export type QuestionClassification = {
  isAllowed: boolean;
  category?: QuestionCategory;
  confidence: 'high' | 'medium' | 'low';
  reason?: string;
};

const ALLOWED_PATTERNS: Record<string, string[]> = {
  products: [
    'product', 'item', 'buy', 'purchase', 'looking for', 'search', 'find',
    'recommend', 'show me', 'do you have', 'price', 'cost', 'how much',
    'cheap', 'expensive', 'category', 'catalog',
    'producto', 'comprar', 'buscar', 'quiero', 'tienen', 'precio', 'cuánto cuesta',
  ],
  orders: [
    'order', 'track', 'status', 'where is my', 'delivery', 'confirm',
    'cancel', 'order id', 'my order', 'pedido', 'rastrear', 'estado',
    'dónde está', 'cancelar', 'mi pedido',
  ],
  shipping: [
    'shipping', 'ship', 'deliver', 'delivery time', 'how long', 'express',
    'international', 'tracking', 'envío', 'entrega', 'cuánto tarda',
  ],
  returns: [
    'return', 'refund', 'exchange', 'money back', 'send back', 'broken',
    'damaged', 'wrong item', 'devolución', 'devolver', 'reembolso', 'cambio',
  ],
  payments: [
    'payment', 'pay', 'card', 'credit', 'debit', 'checkout', 'secure',
    'stripe', 'pago', 'tarjeta', 'pagar',
  ],
  'store-info': [
    'about', 'who are you', 'contact', 'help', 'support', 'hours',
    'acerca', 'contacto', 'ayuda', 'soporte',
  ],
};

const BLOCKED_PATTERNS = [
  'what is the capital', 'who is the president', 'history of',
  'write me a poem', 'write me a story', 'write code',
  'weather', 'news', 'politics', 'sports',
  'recipe', 'health', 'medical', 'legal advice',
  'how to hack', 'how to cheat',
];

const STORE_INDICATORS = ['you', 'your', 'store', 'shop', 'order', 'product', 'buy'];

export function classifyQuestion(question: string): QuestionClassification {
  const q = question.toLowerCase().trim();

  if (q.length < 2) {
    return { isAllowed: false, confidence: 'high', reason: 'Too short' };
  }

  const hasStoreContext = STORE_INDICATORS.some((w) => q.includes(w));

  if (!hasStoreContext) {
    for (const pattern of BLOCKED_PATTERNS) {
      if (q.includes(pattern)) {
        return { isAllowed: false, confidence: 'high', reason: 'Off-topic' };
      }
    }
  }

  let bestMatch: { category: string; count: number } | null = null;
  for (const [category, patterns] of Object.entries(ALLOWED_PATTERNS)) {
    const count = patterns.filter((p) => q.includes(p)).length;
    if (count > 0 && (!bestMatch || count > bestMatch.count)) {
      bestMatch = { category, count };
    }
  }

  if (bestMatch) {
    return {
      isAllowed: true,
      category: bestMatch.category as QuestionCategory,
      confidence: bestMatch.count >= 2 ? 'high' : 'medium',
    };
  }

  // Greetings
  const greetings = ['hello', 'hi', 'hey', 'hola', 'buenos', 'buenas', 'good morning', 'good afternoon'];
  if (greetings.some((g) => q.includes(g))) {
    return { isAllowed: true, category: 'store-info', confidence: 'high', reason: 'Greeting' };
  }

  // Default: allow with low confidence (let the AI handle it)
  return { isAllowed: true, category: 'store-info', confidence: 'low' };
}

export function getOffTopicResponse(): string {
  return "I'm a shopping assistant — I can help you find products, check order status, or answer questions about shipping and returns. What can I help you with?";
}

export function sanitizeInput(input: string): string {
  let sanitized = input.replace(/system:|assistant:|user:/gi, '');
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  if (sanitized.length > 500) sanitized = sanitized.substring(0, 500);
  return sanitized;
}
