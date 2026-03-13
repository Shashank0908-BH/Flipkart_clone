'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard/ProductCard';
import { getProduct, getWishlist } from '@/lib/api';
import type { Product, WishlistItem } from '@/lib/types';
import { WISHLIST_UPDATED_EVENT } from '@/lib/wishlist';

type WishlistViewState = {
  wishlistItems: WishlistItem[];
  products: Product[];
};

async function loadWishlistProducts(): Promise<WishlistViewState> {
  const wishlistItems = await getWishlist();
  const uniqueIds = Array.from(new Set(wishlistItems.map((item) => item.product_id)));

  const productResults = await Promise.all(
    uniqueIds.map(async (productId) => {
      try {
        return await getProduct(productId);
      } catch {
        return null;
      }
    }),
  );

  return {
    wishlistItems,
    products: productResults.filter((product): product is Product => product !== null),
  };
}

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const refreshWishlist = async () => {
      setLoading(true);
      try {
        const data = await loadWishlistProducts();
        if (!cancelled) {
          setWishlistItems(data.wishlistItems);
          setProducts(data.products);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load wishlist');
          setProducts([]);
          setWishlistItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const handleWishlistUpdate = () => {
      refreshWishlist().catch(() => {});
    };

    refreshWishlist().catch(() => {});
    window.addEventListener(WISHLIST_UPDATED_EVENT, handleWishlistUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener(WISHLIST_UPDATED_EVENT, handleWishlistUpdate);
    };
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ padding: 48, textAlign: 'center', color: '#878787' }}>
        Loading wishlist...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ padding: 48, textAlign: 'center', color: '#d32f2f' }}>
        {error}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="container" style={{ maxWidth: 980, paddingTop: 24, paddingBottom: 48 }}>
        <section style={{ background: '#fff', borderRadius: 4, padding: 48, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Your wishlist is empty</h1>
          <p style={{ color: '#878787', marginBottom: 24 }}>
            Save products you love and they will show up here for quick access.
          </p>
          <Link
            href="/products"
            style={{
              display: 'inline-block',
              background: '#2874f0',
              color: '#fff',
              padding: '12px 28px',
              borderRadius: 2,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Browse products
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>My Wishlist</h1>
          <div style={{ color: '#878787', fontSize: 14 }}>
            {wishlistItems.length} saved item{wishlistItems.length === 1 ? '' : 's'}
          </div>
        </div>
        <Link href="/products" style={{ color: '#2874f0', fontWeight: 600, textDecoration: 'none' }}>
          Continue shopping
        </Link>
      </div>

      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
