import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { initializeFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

let db: Firestore | null = null;

function ensureInitialized(): Firestore {
  if (db) return db;

  const apps = getApps();

  if (apps.length > 0) {
    // App already initialized — get its Firestore
    db = initializeFirestore(apps[0], { preferRest: true });
    return db;
  }

  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error('Firebase credentials not configured');
  }

  const app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    storageBucket: `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`,
  });

  db = initializeFirestore(app, { preferRest: true });
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
