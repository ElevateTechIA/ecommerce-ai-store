import { getDb, COLLECTIONS } from './firebase';

export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';

export interface Order {
  id: string;
  productId: string;
  quantity: number;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  stripeSessionId: string | null;
  stripePaymentId: string | null;
  customerEmail: string | null;
  customerName: string | null;
  customerPhone: string | null;
  shippingStatus: 'pending' | 'shipped' | 'delivered' | null;
  trackingNumber: string | null;
  locale: string;
  createdAt: string;
  updatedAt: string;
}

export async function getOrders(): Promise<Order[]> {
  const db = getDb();
  const snapshot = await db
    .collection(COLLECTIONS.orders)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Order));
}

export async function getOrder(id: string): Promise<Order | null> {
  const db = getDb();
  const doc = await db.collection(COLLECTIONS.orders).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Order;
}

export async function getOrderByStripeSession(sessionId: string): Promise<Order | null> {
  const db = getDb();
  const snapshot = await db
    .collection(COLLECTIONS.orders)
    .where('stripeSessionId', '==', sessionId)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Order;
}

export async function createOrder(
  data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Order> {
  const db = getDb();
  const now = new Date().toISOString();

  const docRef = await db.collection(COLLECTIONS.orders).add({
    ...data,
    createdAt: now,
    updatedAt: now,
  });

  return { id: docRef.id, ...data, createdAt: now, updatedAt: now };
}

export async function updateOrder(
  id: string,
  data: Partial<Omit<Order, 'id' | 'createdAt'>>
): Promise<void> {
  const db = getDb();
  await db.collection(COLLECTIONS.orders).doc(id).update({
    ...data,
    updatedAt: new Date().toISOString(),
  });
}
