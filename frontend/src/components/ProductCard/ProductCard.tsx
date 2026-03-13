'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { addToWishlist, removeFromWishlist } from '@/lib/api';
import type { Product } from '@/lib/types';
import {
  addStoredWishlistId,
  getStoredWishlistSet,
  isProductWishlisted,
  removeStoredWishlistId,
  WISHLIST_UPDATED_EVENT,
} from '@/lib/wishlist';

function getBadgeClass(badge: string) {
  const lower = badge.toLowerCase();
  if (lower.includes('assured')) return 'badge badge--assured';
  if (lower.includes('hot')) return 'badge badge--hot';
  if (lower.includes('grab')) return 'badge badge--grab';
  if (lower.includes('top')) return 'badge badge--top';
  return 'badge badge--assured';
}

export default function ProductCard({ product }: { product: Product }) {
  const images =
    product.images && product.images.length > 0
      ? product.images
      : [product.thumbnail || ''];
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(() =>
    isProductWishlisted(product.id),
  );

  useEffect(() => {
    if (!isHovered || images.length <= 1) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setCurrentImgIndex((prev) => (prev + 1) % images.length);
    }, 1300);

    return () => window.clearInterval(interval);
  }, [images.length, isHovered]);

  useEffect(() => {
    const syncWishlistState = () => {
      setIsWishlisted(isProductWishlisted(product.id));
    };

    syncWishlistState();
    window.addEventListener(WISHLIST_UPDATED_EVENT, syncWishlistState);
    return () => window.removeEventListener(WISHLIST_UPDATED_EVENT, syncWishlistState);
  }, [product.id]);

  const handleWishlistToggle = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const shouldAdd = !getStoredWishlistSet().has(product.id);

    if (shouldAdd) {
      addStoredWishlistId(product.id);
      setIsWishlisted(true);
      try {
        await addToWishlist(product.id);
      } catch {
        removeStoredWishlistId(product.id);
        setIsWishlisted(false);
      }
      return;
    }

    removeStoredWishlistId(product.id);
    setIsWishlisted(false);
    try {
      await removeFromWishlist(product.id);
    } catch {
      addStoredWishlistId(product.id);
      setIsWishlisted(true);
    }
  };

  return (
    <Link href={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
      <div
        className="product-card"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setCurrentImgIndex(0);
        }}
      >
        <button
          type="button"
          className={`product-card__wishlist ${isWishlisted ? 'product-card__wishlist--active' : ''}`}
          onClick={handleWishlistToggle}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={isWishlisted ? '#ff6161' : 'none'} stroke={isWishlisted ? '#ff6161' : '#878787'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        <div className="product-card__image-wrap">
          <img
            className="product-card__image"
            src={images[currentImgIndex]}
            alt={product.title}
            loading="lazy"
          />
        </div>

        {product.badges && product.badges.length > 0 ? (
          <div className="product-card__badges">
            {product.badges.slice(0, 2).map((badge) => (
              <span key={badge} className={getBadgeClass(badge)}>
                {badge}
              </span>
            ))}
          </div>
        ) : null}

        <div className="product-card__title">{product.title}</div>

        {product.customer_rating && product.customer_rating > 0 ? (
          <div className="product-card__rating">
            ★ {product.customer_rating.toFixed(1)}
            {product.review_count ? (
              <span className="product-card__rating-count">({product.review_count})</span>
            ) : null}
          </div>
        ) : null}

        <div className="product-card__price-row">
          <span className="product-card__price">₹{product.price.toFixed(0)}</span>
          {product.slashed_price > product.price ? (
            <span className="product-card__slashed">₹{product.slashed_price.toFixed(0)}</span>
          ) : null}
          {product.discount_percentage > 0 ? (
            <span className="product-card__discount">
              {Math.round(product.discount_percentage)}% off
            </span>
          ) : null}
        </div>

        {product.short_description ? (
          <div className="product-card__desc">{product.short_description}</div>
        ) : null}
      </div>
    </Link>
  );
}
