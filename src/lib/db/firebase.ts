import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

function parsePrivateKey(key: string | undefined): string {
  if (!key) return '';
  return key.includes('\\n') ? key.replace(/\\n/g, '\n') : key;
}

function getApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    }),
  });
}

let db: FirebaseFirestore.Firestore | null = null;

export function getDb(): FirebaseFirestore.Firestore {
  if (db) return db;
  const app = getApp();
  db = getFirestore(app);
  return db;
}

export function getStorage() {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'ecommerce-ai-store';
  return getApp().storage().bucket(`${projectId}.firebasestorage.app`);
}

export const COLLECTIONS = {
  products: 'products',
  orders: 'orders',
  users: 'users',
} as const;
