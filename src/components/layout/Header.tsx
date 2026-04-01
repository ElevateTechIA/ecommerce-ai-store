'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ThemeToggle } from '../theme/ThemeToggle';
import { LocaleSwitcher } from '../i18n/LocaleSwitcher';
import { UserMenu } from '../auth/UserMenu';
import { useAuth } from '../auth/AuthProvider';

export function Header() {
  const t = useTranslations('common');
  const locale = useLocale();
  const { role } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href={`/${locale}`}
            className="text-xl font-bold text-gray-900 dark:text-white"
          >
            Store
          </Link>

          <nav className="hidden sm:flex items-center gap-6">
            <Link
              href={`/${locale}/products`}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {t('products')}
            </Link>
            {role === 'admin' && (
              <Link
                href={`/${locale}/admin/products`}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {t('admin')}
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
