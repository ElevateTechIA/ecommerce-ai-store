import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getProduct } from '@/lib/db/products';
import { createOrder, updateOrder } from '@/lib/db/orders';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { productId, quantity = 1, locale = 'en' } = body;

  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 });
  }

  const product = await getProduct(productId);
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  if (product.stock < quantity) {
    return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
  }

  const order = await createOrder({
    productId: product.id,
    quantity,
    totalAmount: product.price * quantity,
    currency: product.currency,
    status: 'PENDING',
    stripeSessionId: null,
    stripePaymentId: null,
    customerEmail: null,
    customerName: null,
    customerPhone: null,
    shippingStatus: null,
    trackingNumber: null,
    locale,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: product.currency.toLowerCase(),
          product_data: {
            name: product.title,
            description: product.description.substring(0, 500),
            ...(product.imageUrl ? { images: [product.imageUrl] } : {}),
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity,
      },
    ],
    metadata: {
      orderId: order.id,
      productId: product.id,
      locale,
    },
    success_url: `${appUrl}/${locale}/order/${order.id}`,
    cancel_url: `${appUrl}/${locale}/products/${product.id}`,
  });

  await updateOrder(order.id, { stripeSessionId: session.id });

  return NextResponse.json({ url: session.url, orderId: order.id });
}
