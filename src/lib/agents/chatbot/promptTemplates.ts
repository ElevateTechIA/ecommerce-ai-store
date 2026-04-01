/**
 * Ecommerce Prompt Templates
 */

import { KnowledgeSection } from './knowledgeBase';

export const SYSTEM_INSTRUCTION = `You are a shopping assistant for an online store.

YOUR ROLE:
- Help customers find products by searching the catalog
- Answer questions about orders, shipping, returns, and payments
- Recommend products based on what customers describe
- Be helpful, concise, and focused on helping customers

RULES:
- ONLY use product information provided in the context — never invent products
- When showing products, always include name and price
- If you don't know, say so honestly
- Keep responses short (2-3 paragraphs max)
- For order inquiries, use the order data provided in context
- Never ask for personal details like credit card numbers

WHEN USER ASKS ABOUT PRODUCTS:
- Use the PRODUCT SEARCH RESULTS in context to recommend specific items
- If no results, suggest the customer browse the catalog

WHEN USER ASKS ABOUT AN ORDER:
- Use the ORDER DATA in context to give status
- If no order data is available, ask for the order ID`;

export interface PromptContext {
  userQuestion: string;
  knowledgeSections?: KnowledgeSection[];
  productResults?: Array<{ id: string; title: string; price: number; category: string | null; stock: number }>;
  orderData?: { id: string; status: string; totalAmount: number; productTitle: string } | null;
}

export function buildPrompt(ctx: PromptContext): string {
  let context = '';

  if (ctx.knowledgeSections && ctx.knowledgeSections.length > 0) {
    const parts = ctx.knowledgeSections.map((s, i) =>
      `[${i + 1}] ${s.category.toUpperCase()}: ${s.content}`
    );
    context += `\n\nSTORE INFORMATION:\n${parts.join('\n\n')}`;
  }

  if (ctx.productResults && ctx.productResults.length > 0) {
    const items = ctx.productResults.map((p) =>
      `- ${p.title} — $${p.price} (${p.stock > 0 ? 'In stock' : 'Out of stock'})${p.category ? ` [${p.category}]` : ''}`
    );
    context += `\n\nPRODUCT SEARCH RESULTS:\n${items.join('\n')}`;
  }

  if (ctx.orderData) {
    context += `\n\nORDER DATA:\n- Order ID: ${ctx.orderData.id}\n- Status: ${ctx.orderData.status}\n- Product: ${ctx.orderData.productTitle}\n- Total: $${ctx.orderData.totalAmount}`;
  }

  return `USER MESSAGE: ${ctx.userQuestion}${context}

Answer the customer's question using the information above. Be helpful and concise.`;
}

export function buildWelcomePrompt(): string {
  return `The customer just started a conversation. Welcome them briefly (1-2 sentences) and let them know you can help find products, check orders, or answer questions about shipping and returns.`;
}

export function validateResponse(response: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Block uncertain language about product info
  const uncertain = [/I think the price/i, /probably costs/i, /I guess it's/i];
  uncertain.forEach((p) => {
    if (p.test(response)) issues.push('Uncertain product info');
  });

  return { isValid: issues.length === 0, issues };
}
