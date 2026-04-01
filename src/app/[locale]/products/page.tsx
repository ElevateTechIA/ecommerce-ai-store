import { getTranslations } from 'next-intl/server';
import { getProducts } from '@/lib/db/products';
import { ProductGrid } from '@/components/products/ProductGrid';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('products');

  const products = await getProducts();

  const mappedProducts = products.map((p) => ({
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
      </div>

      {mappedProducts.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">{t('noProducts')}</p>
      ) : (
        <ProductGrid products={mappedProducts} />
      )}
    </div>
  );
}
