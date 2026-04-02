import admin from 'firebase-admin';

function parsePrivateKey(key: string | undefined): string {
  if (!key) return '';
  // Handle both formats: literal \n in env var, or real newlines
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
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}

let db: admin.firestore.Firestore | null = null;

export function getDb(): admin.firestore.Firestore {
  if (db) return db;
  db = getApp().firestore();
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
