/**
 * Ecommerce WhatsApp Message Handler
 *
 * Handles incoming WhatsApp messages with AI-powered product search,
 * order tracking, and store FAQ.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  sendWhatsAppCloudMessage,
  sendWhatsAppInteractiveList,
  markMessageAsRead,
  sendTypingIndicator,
  simulateHumanDelay,
  IncomingWhatsAppMessage,
} from '@/lib/integrations/whatsapp/client';
import { WhatsAppPhoneConfig } from './config';
import {
  getWhatsAppConversation,
  saveWhatsAppConversation,
  findMatchingAutoReply,
  getAutomationConfig,
  WhatsAppMessage,
} from '@/lib/integrations/firebase-legacy';
import {
  WHATSAPP_SYSTEM_INSTRUCTION,
  buildWhatsAppPrompt,
  detectLanguage,
  getWelcomeMessage,
} from '@/lib/agents/chatbot/whatsappPrompt';
import { searchProducts } from '@/lib/db/products';
import { getOrder } from '@/lib/db/orders';
import { getProduct } from '@/lib/db/products';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function generateAIResponse(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  detectedLanguage: 'en' | 'es',
  extraContext?: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: WHATSAPP_SYSTEM_INSTRUCTION,
  });

  const prompt = buildWhatsAppPrompt(
    userMessage,
    conversationHistory,
    detectedLanguage,
    extraContext
  );

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function handleIncomingWhatsAppMessage(
  incoming: IncomingWhatsAppMessage,
  phoneConfig: WhatsAppPhoneConfig,
  businessPhoneNumberId: string
): Promise<void> {
  if (incoming.type !== 'text' || !incoming.text) return;

  let conversation = await getWhatsAppConversation(incoming.from, businessPhoneNumberId);

  // Deduplication
  if (conversation?.messages.some(m => m.messageId === incoming.messageId)) return;

  await markMessageAsRead(phoneConfig, incoming.messageId);
  const detectedLanguage = detectLanguage(incoming.text);

  if (!conversation) {
    conversation = {
      phoneNumber: incoming.from,
      businessPhoneNumberId,
      displayName: incoming.displayName,
      messages: [],
      language: detectedLanguage,
      lastMessageAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  if (!conversation.status || conversation.status === 'resolved') {
    conversation.status = 'open';
  }

  const userMessage: WhatsAppMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    content: incoming.text,
    timestamp: new Date(),
    messageId: incoming.messageId,
  };
  conversation.messages.push(userMessage);

  // Check auto-reply rules
  const isNewConversation = conversation.messages.length === 1;
  const autoReplyMatch = await findMatchingAutoReply(incoming.text, isNewConversation);

  if (autoReplyMatch) {
    const autoMessage = autoReplyMatch.message
      .replace(/\{\{name\}\}/gi, incoming.displayName || '')
      .replace(/\{\{phone\}\}/gi, incoming.from);

    const config = await getAutomationConfig();
    const ab = config?.antiBlocking;
    if (ab?.enableTypingIndicator !== false) {
      await sendTypingIndicator(phoneConfig, incoming.from);
    }
    await simulateHumanDelay(autoMessage.length, ab?.minReplyDelaySec ?? 1, Math.min(ab?.maxReplyDelaySec ?? 3, 3));

    const assistantMessage: WhatsAppMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: autoMessage,
      timestamp: new Date(),
    };
    conversation.messages.push(assistantMessage);
    conversation.lastMessageAt = new Date();
    conversation.language = detectedLanguage;
    await saveWhatsAppConversation(conversation);

    const sendResult = await sendWhatsAppCloudMessage(phoneConfig, incoming.from, autoMessage);
    if (sendResult.success) {
      assistantMessage.messageId = sendResult.messageId;
      await saveWhatsAppConversation(conversation);
    }
    return;
  }

  // Generate AI response
  let aiResponse: string;
  let sendAsProductList = false;
  let productListItems: Array<{ id: string; title: string; description: string }> = [];

  try {
    const conversationHistory = conversation.messages
      .slice(-10)
      .map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content }));

    const isFirstMessage = conversation.messages.length === 1;
    const isGreeting = /^(hi|hello|hola|buenos|buenas|hey)$/i.test(incoming.text.trim());

    if (isFirstMessage && isGreeting) {
      aiResponse = getWelcomeMessage(detectedLanguage);
    } else {
      aiResponse = await generateAIResponse(
        incoming.text,
        conversationHistory.slice(0, -1),
        detectedLanguage
      );

      // Process [SEARCH_PRODUCTS:query] tag
      const searchMatch = aiResponse.match(/\[SEARCH_PRODUCTS:(.*?)\]/);
      if (searchMatch) {
        const query = searchMatch[1];
        const products = await searchProducts(query);

        aiResponse = aiResponse.replace(/\[SEARCH_PRODUCTS:.*?\]/g, '').trim();

        if (products.length > 0) {
          sendAsProductList = true;
          productListItems = products.slice(0, 5).map(p => ({
            id: p.id,
            title: (detectedLanguage === 'es' && p.titleEs ? p.titleEs : p.title).substring(0, 24),
            description: `$${p.price} - ${p.stock > 0 ? (detectedLanguage === 'es' ? 'Disponible' : 'In stock') : (detectedLanguage === 'es' ? 'Agotado' : 'Out of stock')}`,
          }));
        } else {
          aiResponse += detectedLanguage === 'es'
            ? '\n\nNo encontré productos que coincidan. ¿Puedes intentar con otra búsqueda?'
            : "\n\nI couldn't find matching products. Can you try a different search?";
        }
      }

      // Process [CHECK_ORDER:orderId] tag
      const orderMatch = aiResponse.match(/\[CHECK_ORDER:(.*?)\]/);
      if (orderMatch) {
        const orderId = orderMatch[1].trim();
        const order = await getOrder(orderId);

        aiResponse = aiResponse.replace(/\[CHECK_ORDER:.*?\]/g, '').trim();

        if (order) {
          const product = await getProduct(order.productId);
          const productName = product
            ? (detectedLanguage === 'es' && product.titleEs ? product.titleEs : product.title)
            : 'Product';

          const statusMap: Record<string, { en: string; es: string }> = {
            PENDING: { en: 'Pending payment', es: 'Pendiente de pago' },
            PAID: { en: 'Paid - Processing', es: 'Pagado - En proceso' },
            SHIPPED: { en: 'Shipped', es: 'Enviado' },
            DELIVERED: { en: 'Delivered', es: 'Entregado' },
            FAILED: { en: 'Payment failed', es: 'Pago fallido' },
          };

          const status = statusMap[order.status] || { en: order.status, es: order.status };

          aiResponse += detectedLanguage === 'es'
            ? `\n\n📦 *Pedido ${orderId}*\nProducto: ${productName}\nEstado: ${status.es}\nTotal: $${order.totalAmount}`
            : `\n\n📦 *Order ${orderId}*\nProduct: ${productName}\nStatus: ${status.en}\nTotal: $${order.totalAmount}`;
        } else {
          aiResponse += detectedLanguage === 'es'
            ? '\n\nNo encontré ese pedido. ¿Puedes verificar el ID?'
            : "\n\nI couldn't find that order. Can you double-check the ID?";
        }
      }
    }
  } catch (aiError) {
    console.error('[WA_HANDLER] AI Error:', aiError);
    aiResponse = detectedLanguage === 'es'
      ? 'Lo siento, estoy teniendo dificultades técnicas. Por favor, intenta de nuevo.'
      : "I'm sorry, I'm experiencing technical difficulties. Please try again.";
  }

  // Save response to conversation
  const assistantMessage: WhatsAppMessage = {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: aiResponse,
    timestamp: new Date(),
  };
  conversation.messages.push(assistantMessage);
  conversation.lastMessageAt = new Date();
  conversation.language = detectedLanguage;
  await saveWhatsAppConversation(conversation);

  // Anti-blocking
  const config = await getAutomationConfig();
  const ab = config?.antiBlocking;
  if (ab?.enableTypingIndicator !== false) {
    await sendTypingIndicator(phoneConfig, incoming.from);
  }
  await simulateHumanDelay(aiResponse.length, ab?.minReplyDelaySec ?? 1, ab?.maxReplyDelaySec ?? 5);

  // Send response
  let sendResult;

  if (sendAsProductList && productListItems.length > 0) {
    const buttonText = detectedLanguage === 'es' ? 'Ver productos' : 'View products';
    const sectionTitle = detectedLanguage === 'es' ? 'Productos encontrados' : 'Products found';

    sendResult = await sendWhatsAppInteractiveList(
      phoneConfig,
      incoming.from,
      aiResponse,
      buttonText,
      [{ title: sectionTitle, rows: productListItems }]
    );
  } else {
    sendResult = await sendWhatsAppCloudMessage(phoneConfig, incoming.from, aiResponse);
  }

  if (sendResult.success) {
    assistantMessage.messageId = sendResult.messageId;
    await saveWhatsAppConversation(conversation);
  }
}
