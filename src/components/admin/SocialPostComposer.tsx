'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface ProductData {
  title: string;
  description: string;
  price: string;
  category: string;
}

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', icon: 'f' },
  { id: 'instagram', label: 'Instagram', icon: 'ig' },
  { id: 'tiktok', label: 'TikTok', icon: 'tt' },
] as const;

export function SocialPostComposer({
  product,
  onClose,
}: {
  product: ProductData;
  onClose: () => void;
}) {
  const t = useTranslations('admin');
  const [posts, setPosts] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set(['facebook', 'instagram']));
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/social-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: product.title,
          productDescription: product.description,
          productPrice: parseFloat(product.price),
          productCategory: product.category,
          platforms: Array.from(selected),
          language: 'en',
        }),
      });
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
        setGenerated(true);
      }
    } catch (error) {
      console.error('Failed to generate social posts:', error);
    } finally {
      setLoading(false);
    }
  }

  function togglePlatform(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Post to Social Media</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Generate AI-powered social media posts for <strong>{product.title}</strong>
        </p>

        {/* Platform selection */}
        <div className="flex gap-2 mb-6">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => togglePlatform(p.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selected.has(p.id)
                  ? 'bg-accent text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {!generated ? (
          <button
            onClick={handleGenerate}
            disabled={loading || selected.size === 0}
            className="w-full py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {loading ? t('generating') : 'Generate Posts with AI'}
          </button>
        ) : (
          <div className="space-y-4">
            {PLATFORMS.filter((p) => posts[p.id]).map((p) => (
              <div key={p.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase text-accent">{p.label}</span>
                </div>
                <textarea
                  value={posts[p.id] || ''}
                  onChange={(e) => setPosts((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
                />
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-sm transition-colors"
              >
                {loading ? '...' : 'Regenerate'}
              </button>
              <button
                onClick={() => {
                  // Copy all posts to clipboard
                  const text = Object.entries(posts)
                    .map(([platform, post]) => `--- ${platform.toUpperCase()} ---\n${post}`)
                    .join('\n\n');
                  navigator.clipboard.writeText(text);
                  onClose();
                }}
                className="flex-1 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
              >
                Copy All & Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
