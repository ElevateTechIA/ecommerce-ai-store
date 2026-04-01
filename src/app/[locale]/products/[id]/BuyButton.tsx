'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export function BuyButton({
  productId,
  disabled,
  locale,
}: {
  productId: string;
  disabled: boolean;
  locale: string;
}) {
  const t = useTranslations('common');
  const tCheckout = useTranslations('checkout');
  const [loading, setLoading] = useState(false);

  async function handleBuy() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1, locale }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleBuy}
      disabled={disabled || loading}
      className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? tCheckout('redirecting') : t('buyNow')}
    </button>
  );
}
