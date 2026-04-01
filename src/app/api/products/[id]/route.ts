import { NextRequest, NextResponse } from 'next/server';
import { getProduct, updateProduct, deleteProduct } from '@/lib/db/products';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // Only include fields that were actually sent
  const data: Record<string, any> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.titleEs !== undefined) data.titleEs = body.titleEs;
  if (body.description !== undefined) data.description = body.description;
  if (body.descriptionEs !== undefined) data.descriptionEs = body.descriptionEs;
  if (body.price !== undefined) data.price = Number(body.price);
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
  if (body.images !== undefined) data.images = body.images;
  if (body.category !== undefined) data.category = body.category;
  if (body.stock !== undefined) data.stock = Number(body.stock);
  if (body.isActive !== undefined) data.isActive = body.isActive;

  await updateProduct(id, data);

  const updated = await getProduct(id);
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteProduct(id);
  return NextResponse.json({ success: true });
}
