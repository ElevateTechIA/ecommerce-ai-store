import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { initializeFirestore, getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage as getAdminStorage } from 'firebase-admin/storage';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

let db: Firestore;
let app: App;

try {
  const apps = getApps();

  if (!apps.length) {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      console.warn('Firebase credentials not configured.');
    } else {
      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        storageBucket: `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`,
      });
      db = initializeFirestore(app, { preferRest: true });
    }
  } else {
    app = apps[0];
    db = getFirestore(app);
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
  db = {} as Firestore;
}

export function getDb(): Firestore {
  return db;
}

export function getStorage() {
  return getAdminStorage().bucket();
}

export { getAdminAuth };

export const COLLECTIONS = {
  products: 'products',
  orders: 'orders',
  users: 'users',
} as const;
