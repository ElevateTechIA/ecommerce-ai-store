/**
 * Ecommerce WhatsApp AI Prompt
 */

export const WHATSAPP_SYSTEM_INSTRUCTION = `# Role
You are a shopping assistant for an online store, communicating via WhatsApp.

# Tone
Professional yet friendly. Short messages optimized for mobile. No markdown, minimal emojis.

# Capabilities
- Help customers find and browse products
- Check order status
- Answer questions about shipping, returns, and payments

# Product Search
When a customer asks about products, include this EXACT tag at the END of your message:
[SEARCH_PRODUCTS:search query here]

Examples:
- Customer says "do you have headphones?" → respond naturally, then add [SEARCH_PRODUCTS:headphones]
- Customer says "looking for a gift" → respond naturally, then add [SEARCH_PRODUCTS:gift]

# Order Status
When a customer asks about their order and provides an ID, include this tag:
[CHECK_ORDER:orderId]

If they don't provide an ID, ask for it.

# Rules
- Keep messages SHORT (2-3 sentences)
- ALWAYS respond in the same language the user writes in
- Never ask for payment or personal info via WhatsApp
- Tags go at the END of messages, never in the middle
- If you can't help, suggest visiting the website

# Store Policies
- Free shipping over $50
- 30-day returns
- Secure payments via Stripe`;

export function buildWhatsAppPrompt(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  detectedLanguage: 'en' | 'es',
  extraContext?: string
): string {
  const langInst = detectedLanguage === 'es'
    ? 'RESPOND IN SPANISH.'
    : 'RESPOND IN ENGLISH.';

  const recentHistory = conversationHistory.slice(-10);
  let historyContext = '';
  if (recentHistory.length > 0) {
    historyContext = '\n\nRECENT CONVERSATION:\n' +
      recentHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n');
  }

  let extra = '';
  if (extraContext) {
    extra = `\n\n${extraContext}`;
  }

  return `${langInst}${historyContext}${extra}\nUSER MESSAGE: ${userMessage}`;
}

export function detectLanguage(message: string): 'en' | 'es' {
  const spanishIndicators = [
    /\b(hola|buenos|buenas|gracias|por favor|qué|cómo|cuándo|dónde|quiero|necesito|puedo|tienen|hacen)\b/i,
    /[áéíóúüñ¿¡]/,
    /\b(el|la|los|las|un|una|de|en|que|es|son|para|con|del|al)\b/i,
  ];

  for (const pattern of spanishIndicators) {
    if (pattern.test(message)) return 'es';
  }
  return 'en';
}

export function getWelcomeMessage(language: 'en' | 'es'): string {
  if (language === 'es') {
    return 'Hola! Soy el asistente de la tienda. Puedo ayudarte a encontrar productos, consultar pedidos, o responder preguntas sobre envíos y devoluciones. ¿En qué te ayudo?';
  }
  return "Hi! I'm the store assistant. I can help you find products, check orders, or answer questions about shipping and returns. How can I help?";
}
