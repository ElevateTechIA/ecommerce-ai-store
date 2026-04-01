import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getOrder, updateOrder } from '@/lib/db/orders';
import { updateProduct, getProduct } from '@/lib/db/products';
import { notifyOrderConfirmed } from '@/lib/notifications/dispatcher';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        await updateOrder(orderId, {
          status: 'PAID',
          stripePaymentId: session.payment_intent as string,
          customerEmail: session.customer_details?.email || null,
          customerName: session.customer_details?.name || null,
        });

        const order = await getOrder(orderId);
        if (order) {
          const product = await getProduct(order.productId);
          if (product) {
            await updateProduct(order.productId, {
              stock: product.stock - order.quantity,
            });

            // Send order confirmation notification
            notifyOrderConfirmed(order, product).catch((e) =>
              console.error('Notification failed:', e)
            );
          }
        }
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      // We don't have a direct lookup by paymentIntent, so we log it
      console.error('Payment failed:', paymentIntent.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
