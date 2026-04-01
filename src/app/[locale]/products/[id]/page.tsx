import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getProduct } from '@/lib/db/products';
import { BuyButton } from './BuyButton';
import { ProductGallery } from '@/components/products/ProductGallery';
import { ProductRecommendations } from '@/components/products/ProductRecommendations';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations('products');

  const product = await getProduct(id);
  if (!product) notFound();

  const title = locale === 'es' && product.titleEs ? product.titleEs : product.title;
  const description =
    locale === 'es' && product.descriptionEs ? product.descriptionEs : product.description;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <ProductGallery images={product.images || (product.imageUrl ? [product.imageUrl] : [])} title={title} />

        <div className="flex flex-col">
          {product.category && (
            <span className="text-sm text-muted-foreground uppercase tracking-wide">
              {product.category}
            </span>
          )}

          <h1 className="mt-2 text-3xl font-bold">{title}</h1>

          {product.aiGenerated && (
            <span className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full w-fit">
              {t('aiGenerated')}
            </span>
          )}

          <p className="mt-6 text-4xl font-bold text-accent">
            ${product.price}{' '}
            <span className="text-base font-normal text-muted-foreground">
              {product.currency}
            </span>
          </p>

          <p className="mt-2 text-sm">
            {product.stock > 0 ? (
              <span className="text-green-600 dark:text-green-400">
                {t('inStock')} ({product.stock})
              </span>
            ) : (
              <span className="text-red-600 dark:text-red-400">{t('outOfStock')}</span>
            )}
          </p>

          <div className="mt-8">
            <BuyButton
              productId={product.id}
              disabled={product.stock === 0}
              locale={locale}
            />
          </div>

          <div className="mt-8 pt-8 border-t border-border">
            <h2 className="text-lg font-semibold mb-4">{t('details')}</h2>
            <div className="prose dark:prose-invert max-w-none text-muted-foreground">
              {description.split('\n').map((paragraph: string, i: number) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ProductRecommendations productId={id} locale={locale} />
    </div>
  );
}
