import { getDb, COLLECTIONS } from './firebase';

export interface Product {
  id: string;
  title: string;
  titleEs: string | null;
  description: string;
  descriptionEs: string | null;
  price: number;
  currency: string;
  imageUrl: string | null;
  images: string[];
  category: string | null;
  stock: number;
  isActive: boolean;
  aiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getProducts(): Promise<Product[]> {
  const db = getDb();
  const snapshot = await db
    .collection(COLLECTIONS.products)
    .where('isActive', '==', true)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
}

export async function getAllProducts(): Promise<Product[]> {
  const db = getDb();
  const snapshot = await db
    .collection(COLLECTIONS.products)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
}

export async function getProduct(id: string): Promise<Product | null> {
  const db = getDb();
  const doc = await db.collection(COLLECTIONS.products).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Product;
}

export async function createProduct(
  data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Product> {
  const db = getDb();
  const now = new Date().toISOString();

  const docRef = await db.collection(COLLECTIONS.products).add({
    ...data,
    createdAt: now,
    updatedAt: now,
  });

  return { id: docRef.id, ...data, createdAt: now, updatedAt: now };
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, 'id' | 'createdAt'>>
): Promise<void> {
  const db = getDb();
  await db.collection(COLLECTIONS.products).doc(id).update({
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  const db = getDb();
  await db.collection(COLLECTIONS.products).doc(id).delete();
}

export async function searchProducts(query: string): Promise<Product[]> {
  const products = await getProducts();
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter((w) => w.length > 2);

  return products
    .map((p) => {
      const searchable = `${p.title} ${p.titleEs || ''} ${p.description} ${p.category || ''}`.toLowerCase();
      const score = words.reduce((acc, word) => acc + (searchable.includes(word) ? 1 : 0), 0);
      return { product: p, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((r) => r.product);
}
