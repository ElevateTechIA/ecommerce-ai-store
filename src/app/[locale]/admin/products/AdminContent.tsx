'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminProductList } from './AdminProductList';

interface Product {
  id: string;
  title: string;
  titleEs: string | null;
  description: string;
  descriptionEs: string | null;
  price: string;
  currency: string;
  imageUrl: string | null;
  category: string | null;
  stock: number;
  isActive: boolean;
  aiGenerated: boolean;
}

export function AdminContent() {
  const t = useTranslations('admin');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchProducts() {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(
      data.map((p: any) => ({ ...p, price: p.price.toString() }))
    );
    setLoading(false);
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <AdminProductList products={products} />
        )}
      </div>
    </ProtectedRoute>
  );
}
