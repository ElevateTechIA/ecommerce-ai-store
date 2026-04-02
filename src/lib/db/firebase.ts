import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { initializeFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

const DATABASE_ID = 'ecommerce';

let db: Firestore | null = null;

function ensureInitialized(): Firestore {
  if (db) return db;

  let app;
  const apps = getApps();

  if (apps.length > 0) {
    app = apps[0];
  } else {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error('Firebase credentials not configured');
    }

    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      storageBucket: `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`,
    });
  }

  db = initializeFirestore(app, {}, DATABASE_ID);
  return db;
}

export function getDb(): Firestore {
  return ensureInitialized();
}

export function getStorage() {
  ensureInitialized();
  return getAdminStorage().bucket();
}

export function getAuth() {
  ensureInitialized();
  return getAdminAuth();
}

export const COLLECTIONS = {
  products: 'products',
  orders: 'orders',
  users: 'users',
} as const;
