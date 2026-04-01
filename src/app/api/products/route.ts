import { NextRequest, NextResponse } from 'next/server';
import { getProducts, createProduct } from '@/lib/db/products';

export async function GET() {
  const products = await getProducts();
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const product = await createProduct({
    title: body.title,
    titleEs: body.titleEs || null,
    description: body.description,
    descriptionEs: body.descriptionEs || null,
    price: Number(body.price),
    currency: body.currency || 'USD',
    imageUrl: body.imageUrl || (body.images?.[0] ?? null),
    images: body.images || [],
    category: body.category || null,
    stock: Number(body.stock) || 0,
    isActive: true,
    aiGenerated: body.aiGenerated || false,
  });

  return NextResponse.json(product, { status: 201 });
}
