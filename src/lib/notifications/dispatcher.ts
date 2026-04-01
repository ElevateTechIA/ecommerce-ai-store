/**
 * Order Notification Dispatcher
 *
 * Sends notifications via email and optionally WhatsApp.
 */

import { sendOrderConfirmationEmail, sendShippingUpdateEmail } from './emails';
import { Order } from '@/lib/db/orders';
import { Product } from '@/lib/db/products';

export async function notifyOrderConfirmed(order: Order, product: Product): Promise<void> {
  const productTitle = order.locale === 'es' && product.titleEs ? product.titleEs : product.title;

  // Email notification
  if (order.customerEmail) {
    await sendOrderConfirmationEmail({
      orderId: order.id,
      customerName: order.customerName || 'Customer',
      customerEmail: order.customerEmail,
      productTitle,
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      currency: order.currency,
      locale: order.locale,
    });
    console.log(`[NOTIFY] Order confirmation email sent to ${order.customerEmail}`);
  }

  // WhatsApp notification (if phone available and WhatsApp is configured)
  if (order.customerPhone && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    try {
      const { sendWhatsAppCloudMessage } = await import('@/lib/integrations/whatsapp/client');
      const { getDefaultWhatsAppConfig } = await import('@/lib/integrations/whatsapp/config');
      const config = getDefaultWhatsAppConfig();

      if (config) {
        const message = order.locale === 'es'
          ? `Pedido confirmado! Tu pedido #${order.id.substring(0, 8)} de ${productTitle} ($${order.totalAmount}) ha sido recibido. Te avisaremos cuando sea enviado.`
          : `Order confirmed! Your order #${order.id.substring(0, 8)} for ${productTitle} ($${order.totalAmount}) has been received. We'll notify you when it ships.`;

        await sendWhatsAppCloudMessage(config, order.customerPhone, message);
        console.log(`[NOTIFY] WhatsApp confirmation sent to ${order.customerPhone}`);
      }
    } catch (e) {
      console.error('[NOTIFY] WhatsApp notification failed:', e);
    }
  }
}

export async function notifyShippingUpdate(
  order: Order,
  product: Product,
  trackingNumber: string
): Promise<void> {
  const productTitle = order.locale === 'es' && product.titleEs ? product.titleEs : product.title;

  // Email
  if (order.customerEmail) {
    await sendShippingUpdateEmail({
      orderId: order.id,
      customerName: order.customerName || 'Customer',
      customerEmail: order.customerEmail,
      productTitle,
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      currency: order.currency,
      locale: order.locale,
      trackingNumber,
    });
    console.log(`[NOTIFY] Shipping email sent to ${order.customerEmail}`);
  }

  // WhatsApp
  if (order.customerPhone && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    try {
      const { sendWhatsAppCloudMessage } = await import('@/lib/integrations/whatsapp/client');
      const { getDefaultWhatsAppConfig } = await import('@/lib/integrations/whatsapp/config');
      const config = getDefaultWhatsAppConfig();

      if (config) {
        const message = order.locale === 'es'
          ? `Tu pedido #${order.id.substring(0, 8)} ha sido enviado! Numero de seguimiento: ${trackingNumber}`
          : `Your order #${order.id.substring(0, 8)} has shipped! Tracking number: ${trackingNumber}`;

        await sendWhatsAppCloudMessage(config, order.customerPhone, message);
        console.log(`[NOTIFY] WhatsApp shipping update sent to ${order.customerPhone}`);
      }
    } catch (e) {
      console.error('[NOTIFY] WhatsApp shipping notification failed:', e);
    }
  }
}
