'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { SocialPostComposer } from '@/components/admin/SocialPostComposer';
import { ImageUploader } from '@/components/admin/ImageUploader';

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

interface FormData {
  title: string;
  titleEs: string;
  description: string;
  descriptionEs: string;
  price: string;
  category: string;
  images: string[];
  stock: string;
}

const emptyForm: FormData = {
  title: '',
  titleEs: '',
  description: '',
  descriptionEs: '',
  price: '',
  category: '',
  images: [],
  stock: '0',
};

export function AdminProductList({ products }: { products: Product[] }) {
  const t = useTranslations('admin');
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showSocialComposer, setShowSocialComposer] = useState(false);
  const [lastCreatedProduct, setLastCreatedProduct] = useState<FormData | null>(null);

  async function handleGenerateAI() {
    if (!form.title) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.title,
          productCategory: form.category,
          language: 'en',
        }),
      });
      const data = await res.json();
      if (data.description) {
        setForm((prev) => ({ ...prev, description: data.description }));
      }
      if (data.descriptionEs) {
        setForm((prev) => ({ ...prev, descriptionEs: data.descriptionEs }));
      }
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          titleEs: form.titleEs,
          description: form.description,
          descriptionEs: form.descriptionEs,
          price: parseFloat(form.price),
          category: form.category,
          stock: parseInt(form.stock),
          imageUrl: form.images[0] || null,
          images: form.images,
          aiGenerated: form.description !== emptyForm.description && generating === false,
        }),
      });
      setLastCreatedProduct({ ...form });
      setForm(emptyForm);
      setShowForm(false);
      setShowSocialComposer(true);
      router.refresh();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={() => setShowForm(!showForm)}
        className="mb-6 px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-colors"
      >
        {showForm ? t('cancel') : t('createProduct')}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('productName')}</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('productNameEs')}</label>
              <input
                type="text"
                value={form.titleEs}
                onChange={(e) => setForm({ ...form, titleEs: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium">{t('description')}</label>
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={generating || !form.title}
                className="text-sm px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {generating ? t('generating') : t('generateWithAI')}
              </button>
            </div>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('descriptionEs')}</label>
            <textarea
              value={form.descriptionEs}
              onChange={(e) => setForm({ ...form, descriptionEs: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('imageUrl')}</label>
            <ImageUploader
              images={form.images}
              onChange={(images) => setForm({ ...form, images })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('price')}</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('category')}</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('stock')}</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {saving ? '...' : t('save')}
          </button>
        </form>
      )}

      {/* Product table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 font-medium">{t('productName')}</th>
              <th className="text-left p-3 font-medium">{t('category')}</th>
              <th className="text-right p-3 font-medium">{t('price')}</th>
              <th className="text-right p-3 font-medium">{t('stock')}</th>
              <th className="text-right p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-muted/50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {product.title}
                    {product.aiGenerated && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                        AI
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-muted-foreground">{product.category || '-'}</td>
                <td className="p-3 text-right font-mono">${product.price}</td>
                <td className="p-3 text-right">{product.stock}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 dark:text-red-400 hover:underline text-xs"
                  >
                    {t('delete')}
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showSocialComposer && lastCreatedProduct && (
        <SocialPostComposer
          product={{
            title: lastCreatedProduct.title,
            description: lastCreatedProduct.description,
            price: lastCreatedProduct.price,
            category: lastCreatedProduct.category,
          }}
          onClose={() => {
            setShowSocialComposer(false);
            setLastCreatedProduct(null);
          }}
        />
      )}
    </div>
  );
}
