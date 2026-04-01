'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ProductCard } from './ProductCard';

interface Recommendation {
  productId: string;
  reason: string;
  score: number;
}

interface RecommendedProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  imageUrl: string | null;
  category: string | null;
  stock: number;
  aiGenerated: boolean;
}

export function ProductRecommendations({
  productId,
  locale,
}: {
  productId: string;
  locale: string;
}) {
  const t = useTranslations('products');
  const [products, setProducts] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [recsRes, productsRes] = await Promise.all([
          fetch('/api/ai/recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, language: locale }),
          }),
          fetch('/api/products'),
        ]);

        if (!recsRes.ok || !productsRes.ok) {
          setLoading(false);
          return;
        }

        const recs = await recsRes.json();
        const allProducts = await productsRes.json();

        if (!recs.recommendations?.length) {
          setLoading(false);
          return;
        }

        // Match recommendations to actual products, exclude current
        const recIds = new Set(
          recs.recommendations
            .filter((r: Recommendation) => r.productId !== productId)
            .map((r: Recommendation) => r.productId)
        );

        const matched = allProducts
          .filter((p: any) => recIds.has(p.id))
          .slice(0, 4)
          .map((p: any) => ({
            id: p.id,
            title: locale === 'es' && p.titleEs ? p.titleEs : p.title,
            description: locale === 'es' && p.descriptionEs ? p.descriptionEs : p.description,
            price: p.price.toString(),
            currency: p.currency,
            imageUrl: p.imageUrl,
            category: p.category,
            stock: p.stock,
            aiGenerated: p.aiGenerated,
          }));

        setProducts(matched);
      } catch {
        // Silent fail — just don't show recommendations
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [productId, locale]);

  if (loading) {
    return (
      <div className="mt-12 pt-8 border-t border-border">
        <div className="h-6 w-48 bg-muted rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[4/3] bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <h2 className="text-xl font-bold mb-6">
        {locale === 'es' ? 'También te puede gustar' : 'You might also like'}
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} {...p} />
        ))}
      </div>
    </div>
  );
}
