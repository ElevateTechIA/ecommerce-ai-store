import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/db/firebase';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll('files') as File[];

  if (!files.length) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  const bucket = getStorage();
  const urls: string[] = [];

  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: `Invalid file type: ${file.type}` }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `products/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const fileRef = bucket.file(fileName);
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    await fileRef.makePublic();

    const url = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    urls.push(url);
  }

  return NextResponse.json({ urls });
}
