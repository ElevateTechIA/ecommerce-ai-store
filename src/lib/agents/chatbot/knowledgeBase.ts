/**
 * Ecommerce Knowledge Base
 *
 * Store policies, FAQ, and static info. Product data comes from Firestore dynamically.
 */

export interface KnowledgeSection {
  id: string;
  category: string;
  keywords: string[];
  content: string;
  priority: number;
}

export const knowledgeBase: KnowledgeSection[] = [
  {
    id: 'shipping-general',
    category: 'shipping',
    keywords: ['shipping', 'delivery', 'ship', 'deliver', 'how long', 'envío', 'envio', 'entrega', 'cuánto tarda'],
    priority: 9,
    content: `Shipping: Standard 5-7 business days, Express 2-3 days. Free shipping on orders over $50. We ship domestically and internationally. Tracking number sent via email when order ships.`,
  },
  {
    id: 'shipping-international',
    category: 'shipping',
    keywords: ['international', 'outside', 'abroad', 'country', 'internacional', 'otro país'],
    priority: 7,
    content: `International Shipping: Available to most countries, 7-14 business days. Customer responsible for customs duties. Tracking included.`,
  },
  {
    id: 'returns-policy',
    category: 'returns',
    keywords: ['return', 'refund', 'exchange', 'money back', 'devolución', 'devolver', 'reembolso', 'cambio'],
    priority: 9,
    content: `Returns: 30-day return window. Items must be unused and in original packaging. Free returns. Refunds in 5-7 business days. Exchanges available. Provide your order ID to start a return.`,
  },
  {
    id: 'payments-methods',
    category: 'payments',
    keywords: ['payment', 'pay', 'card', 'credit', 'debit', 'pago', 'tarjeta', 'pagar'],
    priority: 8,
    content: `Payment: Visa, MasterCard, Amex, Discover. Secure checkout via Stripe. We never store card info. All transactions encrypted.`,
  },
  {
    id: 'orders-tracking',
    category: 'orders',
    keywords: ['order', 'track', 'status', 'where is', 'pedido', 'rastrear', 'estado', 'dónde está'],
    priority: 9,
    content: `Order Tracking: Provide your order ID and I'll check the status. Tracking numbers sent via email when shipped. Statuses: Pending → Paid → Shipped → Delivered.`,
  },
  {
    id: 'orders-cancel',
    category: 'orders',
    keywords: ['cancel', 'cancelar'],
    priority: 7,
    content: `Cancellation: Orders can be cancelled within 1 hour. Shipped orders cannot be cancelled but can be returned after delivery.`,
  },
  {
    id: 'products-help',
    category: 'products',
    keywords: ['product', 'item', 'buy', 'looking for', 'search', 'find', 'recommend', 'producto', 'buscar', 'comprar', 'quiero', 'price', 'cost', 'how much', 'precio', 'cuánto'],
    priority: 10,
    content: `I can help you find products! Tell me what you're looking for — a product name, category, or describe what you need. I'll search our catalog and show you options with prices.`,
  },
  {
    id: 'store-about',
    category: 'store-info',
    keywords: ['about', 'who', 'store', 'contact', 'help', 'acerca', 'quién', 'tienda', 'contacto', 'ayuda'],
    priority: 6,
    content: `Welcome! I can help you find products, check order status, and answer questions about shipping, returns, and payments.`,
  },
];

export function searchKnowledgeBase(query: string): KnowledgeSection[] {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);

  const scoredSections = knowledgeBase.map((section) => {
    let score = 0;
    section.keywords.forEach((kw) => {
      if (queryLower.includes(kw.toLowerCase())) score += 10;
    });
    queryWords.forEach((word) => {
      if (word.length > 3 && section.content.toLowerCase().includes(word)) score += 2;
    });
    score += section.priority * 0.1;
    return { section, score };
  });

  return scoredSections
    .filter((i) => i.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((i) => i.section);
}
