import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getOrder } from '@/lib/db/orders';
import { getProduct } from '@/lib/db/products';

export const dynamic = 'force-dynamic';

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const t = await getTranslations('order');

  const order = await getOrder(id);
  if (!order) notFound();

  const product = await getProduct(order.productId);
  const productTitle = product
    ? locale === 'es' && product.titleEs
      ? product.titleEs
      : product.title
    : 'Unknown Product';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold">{t('confirmed')}</h1>
        <p className="mt-2 text-muted-foreground">{t('thankYou')}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">{t('details')}</h2>

        <dl className="space-y-4">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('orderId')}</dt>
            <dd className="font-mono text-sm">{order.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('status')}</dt>
            <dd>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  order.status === 'PAID'
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                }`}
              >
                {order.status === 'PAID' ? t('paid') : t('pending')}
              </span>
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('product')}</dt>
            <dd>{productTitle}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('amount')}</dt>
            <dd className="font-semibold">
              ${order.totalAmount} {order.currency}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-8 text-center">
        <Link
          href={`/${locale}/products`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accent-hover transition-colors"
        >
          {t('viewProducts')}
        </Link>
      </div>
    </div>
  );
}
