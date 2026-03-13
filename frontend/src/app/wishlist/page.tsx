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
      <div className="container page-state">
        Loading wishlist...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container page-state page-state--error">
        {error}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="container page-shell--narrow">
        <section className="wishlist-page__empty">
          <h1 className="wishlist-page__empty-title">Your wishlist is empty</h1>
          <p className="wishlist-page__empty-copy">
            Save products you love and they will show up here for quick access.
          </p>
          <Link href="/products" className="button-link button-link--primary">
            Browse products
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="container page-shell--narrow">
      <div className="wishlist-page__header">
        <div className="wishlist-page__meta">
          <h1 className="wishlist-page__title">My Wishlist</h1>
          <div className="wishlist-page__count">
            {wishlistItems.length} saved item{wishlistItems.length === 1 ? '' : 's'}
          </div>
        </div>
        <Link href="/products" className="wishlist-page__link">
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
