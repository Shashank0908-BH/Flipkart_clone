'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard/ProductCard';
import { getCategories, searchProducts } from '@/lib/api';
import type { Category, Product } from '@/lib/types';

function ProductListingInner() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const minRating = searchParams.get('min_rating') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category,
    min_price: '',
    max_price: '',
    min_rating: minRating,
  });

  useEffect(() => {
    setFilters((current) => {
      if (current.category === category && current.min_rating === minRating) {
        return current;
      }

      return {
        ...current,
        category,
        min_rating: minRating,
      };
    });
  }, [category, minRating]);

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      try {
        const data = await getCategories();
        if (!cancelled) {
          setCategories(data);
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
        }
      }
    };

    loadCategories().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      setLoading(true);
      try {
        const data = await searchProducts({
          q: q || undefined,
          category: filters.category || undefined,
          min_price: filters.min_price ? Number(filters.min_price) : undefined,
          max_price: filters.max_price ? Number(filters.max_price) : undefined,
          min_rating: filters.min_rating ? Number(filters.min_rating) : undefined,
        });
        if (!cancelled) {
          setProducts(data);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProducts().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [filters, q]);

  return (
    <div className="container products-page">
      <div className="products-page__layout">
        <aside className="filters products-page__filters">
          <div className="filters__title">Filters</div>

          <div className="filter-group">
            <div className="filter-group__title">Category</div>
            <label className="filter-group__option">
              <input
                type="radio"
                name="category"
                checked={filters.category === ''}
                onChange={() => setFilters((current) => ({ ...current, category: '' }))}
              />
              All Categories
            </label>
            {categories.map((item) => (
              <label key={item.slug} className="filter-group__option">
                <input
                  type="radio"
                  name="category"
                  checked={filters.category === item.slug}
                  onChange={() => setFilters((current) => ({ ...current, category: item.slug }))}
                />
                {item.name}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <div className="filter-group__title">Price Range</div>
            <div className="price-range">
              <input
                placeholder="Min"
                type="number"
                value={filters.min_price}
                onChange={(event) => setFilters((current) => ({ ...current, min_price: event.target.value }))}
              />
              <span>-</span>
              <input
                placeholder="Max"
                type="number"
                value={filters.max_price}
                onChange={(event) => setFilters((current) => ({ ...current, max_price: event.target.value }))}
              />
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-group__title">Customer Rating</div>
            {[4, 3, 2].map((rating) => (
              <label key={rating} className="filter-group__option">
                <input
                  type="radio"
                  name="rating"
                  checked={filters.min_rating === String(rating)}
                  onChange={() => setFilters((current) => ({ ...current, min_rating: String(rating) }))}
                />
                {rating}★ & above
              </label>
            ))}
            <label className="filter-group__option">
              <input
                type="radio"
                name="rating"
                checked={filters.min_rating === ''}
                onChange={() => setFilters((current) => ({ ...current, min_rating: '' }))}
              />
              All Ratings
            </label>
          </div>
        </aside>

        <div className="products-page__results">
          <div className="products-page__summary">
            {q ? <>Showing results for &quot;{q}&quot; · </> : null}
            {products.length} products found
          </div>
          {loading ? (
            <div className="page-state">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="page-state">
              No products found. Try adjusting your filters.
            </div>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductListingPage() {
  return (
    <Suspense fallback={<div className="page-state">Loading...</div>}>
      <ProductListingInner />
    </Suspense>
  );
}
