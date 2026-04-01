import { NextRequest, NextResponse } from 'next/server';
import { getOrder, updateOrder } from '@/lib/db/orders';
import { getProduct } from '@/lib/db/products';
import { notifyShippingUpdate } from '@/lib/notifications/dispatcher';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { trackingNumber } = await request.json();

  if (!trackingNumber) {
    return NextResponse.json({ error: 'trackingNumber is required' }, { status: 400 });
  }

  const order = await getOrder(id);
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.status !== 'PAID') {
    return NextResponse.json({ error: 'Order must be paid before shipping' }, { status: 400 });
  }

  await updateOrder(id, {
    shippingStatus: 'shipped',
    trackingNumber,
  });

  const product = await getProduct(order.productId);
  if (product) {
    notifyShippingUpdate(order, product, trackingNumber).catch((e) =>
      console.error('Shipping notification failed:', e)
    );
  }

  return NextResponse.json({ success: true, trackingNumber });
}
