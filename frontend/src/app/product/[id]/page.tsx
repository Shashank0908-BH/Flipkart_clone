'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BagIcon, BoltIcon } from '@/components/icons/FlipkartIcons';
import { addToCart, getInventory, getProduct, searchProducts } from '@/lib/api';
import type { InventoryStatus, Product } from '@/lib/types';

const OFFER_LINES = [
  '5% Cashback on Flipkart Axis Bank Card',
  'No Cost EMI on select cards',
  'Extra savings on UPI and wallet payments',
];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [inventory, setInventory] = useState<InventoryStatus | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadProduct = async () => {
      try {
        const [productData, inventoryData] = await Promise.all([
          getProduct(productId),
          getInventory(productId),
        ]);

        if (cancelled) {
          return;
        }

        setProduct(productData);
        setInventory(inventoryData);

        const relatedProducts = await searchProducts({
          category: productData.category,
        });

        if (!cancelled) {
          setSimilarProducts(
            relatedProducts.filter((item) => item.id !== productId).slice(0, 8),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load product');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProduct().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const handleAddToCart = async () => {
    try {
      await addToCart(productId);
      setAddedToCart(true);
      window.setTimeout(() => setAddedToCart(false), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add to cart');
    }
  };

  const handleBuyNow = async () => {
    try {
      await addToCart(productId);
      router.push('/checkout');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to continue to checkout');
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: 48, textAlign: 'center', color: '#878787' }}>Loading product...</div>;
  }

  if (!product) {
    return <div className="container" style={{ padding: 48, textAlign: 'center' }}>{error || 'Product not found.'}</div>;
  }

  const galleryImages = product.images.slice(0, 4);
  const primaryImage = galleryImages[selectedImage] || product.thumbnail || '';
  const isOutOfStock = inventory?.status === 'Out of Stock';

  return (
    <div className="container" style={{ paddingTop: 16, paddingBottom: 48 }}>
      <div className="pdp-shell">
        <section className="pdp-gallery-grid">
          <div className="pdp-gallery-grid__featured">
            <img src={primaryImage} alt={product.title} />
          </div>
          <div className="pdp-gallery-grid__thumbs">
            {galleryImages.map((image, index) => (
              <button
                type="button"
                key={`${product.id}-${index}`}
                className={`pdp-gallery-grid__thumb ${selectedImage === index ? 'pdp-gallery-grid__thumb--active' : ''}`}
                onClick={() => setSelectedImage(index)}
              >
                <img src={image} alt={`${product.title} ${index + 1}`} />
              </button>
            ))}
          </div>
        </section>

        <section className="pdp-summary">
          <div className="pdp-summary__top-strip">
            <img src={product.thumbnail || product.images[0]} alt={product.title} />
            <div>
              <span className="pdp-summary__ad">AD</span>
              <div className="pdp-summary__suggestion">
                Similar pick: {similarProducts[0]?.title || product.title}
              </div>
            </div>
          </div>

          {product.brand ? <div className="pdp__brand">{product.brand}</div> : null}
          <h1 className="pdp__title">{product.title}</h1>

          <div className="pdp__rating-row">
            {product.customer_rating ? (
              <div className="product-card__rating">
                ★ {product.customer_rating.toFixed(1)}
              </div>
            ) : null}
            {product.review_count ? (
              <span style={{ fontSize: 14, color: '#878787' }}>
                {product.review_count.toLocaleString('en-IN')} ratings
              </span>
            ) : null}
          </div>

          <div className="pdp__price-section">
            {product.discount_percentage > 0 ? (
              <span className="pdp__discount">↓{Math.round(product.discount_percentage)}%</span>
            ) : null}
            <span className="pdp__slashed">₹{product.slashed_price.toFixed(0)}</span>
            <span className="pdp__price">₹{product.price.toFixed(0)}</span>
          </div>

          <div className="pdp-offer-banner">
            <span className="pdp-offer-banner__tag">WOW DEAL</span>
            <span>Buy at ₹{Math.max(99, product.price - 68).toFixed(0)} with extra offers</span>
          </div>

          <div className="pdp-offers">
            {OFFER_LINES.map((offer) => (
              <div key={offer} className="pdp-offers__item">
                {offer}
              </div>
            ))}
          </div>

          <div className="pdp-stock">
            <span className={isOutOfStock ? 'pdp-stock__state pdp-stock__state--out' : 'pdp-stock__state'}>
              {isOutOfStock
                ? 'Currently out of stock'
                : inventory?.status === 'Grab or Gone'
                  ? `Only ${inventory.available_stock} left in stock`
                  : `In stock • ${inventory?.available_stock || product.stock || 0} available`}
            </span>
            <span className="pdp-stock__delivery">
              Deliver to {product.metadata?.seller ? '226012' : 'your location'}
            </span>
          </div>

          <div className="pdp__actions">
            <button
              className="btn btn--cart"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              style={{ opacity: isOutOfStock ? 0.5 : 1 }}
            >
              <BagIcon size={18} />
              <span>{addedToCart ? 'Added to Cart' : 'Add to Cart'}</span>
            </button>
            <button
              className="btn btn--buy"
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              style={{ opacity: isOutOfStock ? 0.5 : 1 }}
            >
              <BoltIcon size={18} />
              <span>Buy Now</span>
            </button>
          </div>

          {error ? <div style={{ color: '#d32f2f', fontSize: 14 }}>{error}</div> : null}

          <div className="pdp__desc">
            <h3>Product Description</h3>
            <p>{product.description}</p>
          </div>

          <div className="pdp__specs">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Highlights</h3>
            {product.metadata?.capacity ? (
              <div className="pdp__spec-row">
                <span className="pdp__spec-label">Capacity</span>
                <span className="pdp__spec-value">{product.metadata.capacity}</span>
              </div>
            ) : null}
            {product.metadata?.material ? (
              <div className="pdp__spec-row">
                <span className="pdp__spec-label">Material</span>
                <span className="pdp__spec-value">{product.metadata.material}</span>
              </div>
            ) : null}
            {product.metadata?.dimensions ? (
              <div className="pdp__spec-row">
                <span className="pdp__spec-label">Dimensions</span>
                <span className="pdp__spec-value">
                  {product.metadata.dimensions.width} × {product.metadata.dimensions.height} × {product.metadata.dimensions.depth} cm
                </span>
              </div>
            ) : null}
            {product.shipping_info ? (
              <div className="pdp__spec-row">
                <span className="pdp__spec-label">Shipping</span>
                <span className="pdp__spec-value">{product.shipping_info}</span>
              </div>
            ) : null}
            {product.return_policy ? (
              <div className="pdp__spec-row">
                <span className="pdp__spec-label">Returns</span>
                <span className="pdp__spec-value">{product.return_policy}</span>
              </div>
            ) : null}
            {product.warranty_info ? (
              <div className="pdp__spec-row">
                <span className="pdp__spec-label">Warranty</span>
                <span className="pdp__spec-value">{product.warranty_info}</span>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      {similarProducts.length > 0 ? (
        <section style={{ marginTop: 32 }}>
          <div className="section-title">Similar Products</div>
          <div className="deals-strip">
            <div className="deals-strip__scroll">
              {similarProducts.map((item) => (
                <Link key={item.id} href={`/product/${item.id}`} className="deal-card">
                  <img className="deal-card__img" src={item.thumbnail || item.images[0]} alt={item.title} loading="lazy" />
                  <div className="deal-card__title">{item.title}</div>
                  <div className="deal-card__price">₹{item.price.toFixed(0)}</div>
                  <div className="deal-card__discount">{Math.round(item.discount_percentage)}% off</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
