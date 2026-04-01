import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getOrCreateUser } from '@/lib/db/users';

// Ensure firebase admin is initialized
import '@/lib/db/firebase';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const user = await getOrCreateUser(decoded.uid, {
      email: decoded.email || '',
      displayName: decoded.name || null,
      photoURL: decoded.picture || null,
    });

    return NextResponse.json({ role: user.role });
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
