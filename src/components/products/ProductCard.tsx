'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

interface ProductCardProps {
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

export function ProductCard({
  id,
  title,
  description,
  price,
  currency,
  imageUrl,
  category,
  stock,
  aiGenerated,
}: ProductCardProps) {
  const t = useTranslations('products');
  const locale = useLocale();

  return (
    <Link
      href={`/${locale}/products/${id}`}
      className="group block rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}
        {aiGenerated && (
          <span className="absolute top-2 right-2 px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded-full">
            {t('aiGenerated')}
          </span>
        )}
        {stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="px-3 py-1 bg-red-600 text-white text-sm rounded-full font-medium">
              {t('outOfStock')}
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        {category && (
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            {category}
          </span>
        )}
        <h3 className="mt-1 text-lg font-semibold text-card-foreground group-hover:text-accent transition-colors line-clamp-1">
          {title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{description}</p>
        <p className="mt-3 text-xl font-bold text-accent">
          ${price} <span className="text-sm font-normal text-muted-foreground">{currency}</span>
        </p>
      </div>
    </Link>
  );
}
