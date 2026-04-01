/**
 * Ecommerce Email Templates & Sending
 */

import { Resend } from 'resend';
import nodemailer from 'nodemailer';

interface OrderEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  productTitle: string;
  quantity: number;
  totalAmount: number;
  currency: string;
  locale: string;
}

interface ShippingEmailData extends OrderEmailData {
  trackingNumber: string;
}

const translations = {
  en: {
    orderConfirmation: {
      subject: 'Order Confirmed - #{orderId}',
      heading: 'Thank you for your order!',
      orderNumber: 'Order Number',
      product: 'Product',
      quantity: 'Quantity',
      total: 'Total',
      message: 'We have received your payment and are preparing your order. You will receive another email when your order ships.',
    },
    shippingUpdate: {
      subject: 'Your Order Has Shipped - #{orderId}',
      heading: 'Your order is on the way!',
      trackingNumber: 'Tracking Number',
      message: 'Your order has been shipped. You can track your package using the tracking number above.',
    },
  },
  es: {
    orderConfirmation: {
      subject: 'Pedido Confirmado - #{orderId}',
      heading: '¡Gracias por tu pedido!',
      orderNumber: 'Número de Pedido',
      product: 'Producto',
      quantity: 'Cantidad',
      total: 'Total',
      message: 'Hemos recibido tu pago y estamos preparando tu pedido. Recibirás otro email cuando tu pedido sea enviado.',
    },
    shippingUpdate: {
      subject: 'Tu Pedido Ha Sido Enviado - #{orderId}',
      heading: '¡Tu pedido va en camino!',
      trackingNumber: 'Número de Seguimiento',
      message: 'Tu pedido ha sido enviado. Puedes rastrear tu paquete con el número de seguimiento de arriba.',
    },
  },
};

function buildOrderConfirmationHtml(data: OrderEmailData): string {
  const t = translations[data.locale === 'es' ? 'es' : 'en'].orderConfirmation;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb; font-size: 24px;">${t.heading}</h1>
      <p style="color: #666; font-size: 16px;">${t.message}</p>
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #666;">${t.orderNumber}</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">${data.orderId}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">${t.product}</td><td style="padding: 8px 0; text-align: right;">${data.productTitle}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">${t.quantity}</td><td style="padding: 8px 0; text-align: right;">${data.quantity}</td></tr>
          <tr style="border-top: 2px solid #e5e7eb;"><td style="padding: 12px 0; font-weight: bold;">${t.total}</td><td style="padding: 12px 0; font-weight: bold; text-align: right; color: #2563eb; font-size: 20px;">$${data.totalAmount} ${data.currency}</td></tr>
        </table>
      </div>
    </div>
  `;
}

function buildShippingUpdateHtml(data: ShippingEmailData): string {
  const t = translations[data.locale === 'es' ? 'es' : 'en'].shippingUpdate;
  const tOrder = translations[data.locale === 'es' ? 'es' : 'en'].orderConfirmation;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb; font-size: 24px;">${t.heading}</h1>
      <p style="color: #666; font-size: 16px;">${t.message}</p>
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #666;">${tOrder.orderNumber}</td><td style="padding: 8px 0; font-weight: bold; text-align: right;">${data.orderId}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">${tOrder.product}</td><td style="padding: 8px 0; text-align: right;">${data.productTitle}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">${t.trackingNumber}</td><td style="padding: 8px 0; font-weight: bold; text-align: right; color: #2563eb;">${data.trackingNumber}</td></tr>
        </table>
      </div>
    </div>
  `;
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  // Try Resend first
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.SMTP_FROM || 'Store <noreply@store.com>',
        to,
        subject,
        html,
      });
      return true;
    } catch (e) {
      console.error('Resend failed, trying SMTP:', e);
    }
  }

  // Fallback to SMTP
  if (process.env.SMTP_HOST) {
    try {
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      await transport.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
      });
      return true;
    } catch (e) {
      console.error('SMTP failed:', e);
    }
  }

  console.warn('No email provider configured');
  return false;
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  const t = translations[data.locale === 'es' ? 'es' : 'en'].orderConfirmation;
  const subject = t.subject.replace('#{orderId}', data.orderId.substring(0, 8));
  const html = buildOrderConfirmationHtml(data);
  return sendEmail(data.customerEmail, subject, html);
}

export async function sendShippingUpdateEmail(data: ShippingEmailData): Promise<boolean> {
  const t = translations[data.locale === 'es' ? 'es' : 'en'].shippingUpdate;
  const subject = t.subject.replace('#{orderId}', data.orderId.substring(0, 8));
  const html = buildShippingUpdateHtml(data);
  return sendEmail(data.customerEmail, subject, html);
}
