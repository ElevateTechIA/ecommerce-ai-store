'use client';

import { useState, useRef, useCallback } from 'react';

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [selected, setSelected] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imageRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!imageRef.current || !zoomed) return;
      const rect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setZoomPos({ x, y });
    },
    [zoomed]
  );

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
        <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
    );
  }

  return (
    <div>
      {/* Main image with zoom */}
      <div
        ref={imageRef}
        className="aspect-square rounded-xl bg-muted overflow-hidden mb-3 cursor-zoom-in relative"
        onClick={() => setZoomed(!zoomed)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setZoomed(false)}
      >
        <img
          src={images[selected]}
          alt={`${title} - ${selected + 1}`}
          className={`w-full h-full transition-transform duration-200 ${
            zoomed ? 'scale-[2.5]' : 'scale-100 object-cover'
          }`}
          style={
            zoomed
              ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
              : undefined
          }
          draggable={false}
        />

        {/* Zoom hint */}
        {!zoomed && (
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/50 text-white text-xs flex items-center gap-1 pointer-events-none">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            Zoom
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => { setSelected(i); setZoomed(false); }}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                i === selected ? 'border-accent' : 'border-transparent hover:border-border'
              }`}
            >
              <img src={url} alt={`${title} - ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
