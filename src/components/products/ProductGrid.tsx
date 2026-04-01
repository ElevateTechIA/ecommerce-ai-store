'use client';

import { ProductCard } from './ProductCard';

interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  imageUrl?: string | null;
  category?: string | null;
  stock: number;
  aiGenerated: boolean;
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  );
}
