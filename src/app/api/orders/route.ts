import { NextRequest, NextResponse } from 'next/server';
import { getOrders, createOrder } from '@/lib/db/orders';
import { getProduct } from '@/lib/db/products';

export async function GET() {
  const orders = await getOrders();
  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const product = await getProduct(body.productId);
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const quantity = body.quantity || 1;
  const totalAmount = product.price * quantity;

  const order = await createOrder({
    productId: body.productId,
    quantity,
    totalAmount,
    currency: product.currency,
    status: 'PENDING',
    stripeSessionId: null,
    stripePaymentId: null,
    customerEmail: body.customerEmail || null,
    customerName: body.customerName || null,
    customerPhone: body.customerPhone || null,
    shippingStatus: null,
    trackingNumber: null,
    locale: body.locale || 'en',
  });

  return NextResponse.json(order, { status: 201 });
}
