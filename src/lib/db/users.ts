import { getDb, COLLECTIONS } from './firebase';

export type UserRole = 'admin' | 'customer';

export interface AppUser {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export async function getUser(uid: string): Promise<AppUser | null> {
  const db = getDb();
  const doc = await db.collection(COLLECTIONS.users).doc(uid).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as AppUser;
}

export async function getOrCreateUser(
  uid: string,
  data: { email: string; displayName: string | null; photoURL: string | null }
): Promise<AppUser> {
  const db = getDb();
  const ref = db.collection(COLLECTIONS.users).doc(uid);
  const doc = await ref.get();

  if (doc.exists) {
    // Update profile info on each login
    await ref.update({
      displayName: data.displayName,
      photoURL: data.photoURL,
      updatedAt: new Date().toISOString(),
    });
    return { id: doc.id, ...doc.data(), ...data } as AppUser;
  }

  // First user ever = admin, rest = customer
  const usersSnapshot = await db.collection(COLLECTIONS.users).limit(1).get();
  const role: UserRole = usersSnapshot.empty ? 'admin' : 'customer';

  const now = new Date().toISOString();
  const newUser: Omit<AppUser, 'id'> = {
    email: data.email,
    displayName: data.displayName,
    photoURL: data.photoURL,
    role,
    createdAt: now,
    updatedAt: now,
  };

  await ref.set(newUser);
  return { id: uid, ...newUser };
}
