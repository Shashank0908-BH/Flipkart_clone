'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCart, removeCartItem, updateCartItem } from '@/lib/api';
import type { CartResponse } from '@/lib/types';

export default function CartPage() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCart = async () => {
    setLoading(true);
    try {
      const data = await getCart();
      setCart(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load cart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart().catch(() => {});
  }, []);

  const handleQtyChange = async (productId: string, newQty: number) => {
    try {
      if (newQty <= 0) {
        await removeCartItem(productId);
      } else {
        await updateCartItem(productId, newQty);
      }
      await fetchCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update cart');
    }
  };

  if (loading) {
    return <div className="container page-state">Loading cart...</div>;
  }

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const totalSavings = items.reduce((total, item) => {
    const slashed = item.slashed_price || item.price;
    return total + Math.max(0, slashed - item.price) * item.quantity;
  }, 0);

  return (
    <div className="container">
      <div className="cart-page">
        <div className="cart-items">
          <div className="cart-address">
            <div>
              <div className="cart-address__title">Deliver to: Shiv Singh Kanaujia, 226012</div>
              <div className="cart-address__subtitle">Vikram Nagar near RDSO, Lucknow</div>
            </div>
            <button className="cart-address__button">Change</button>
          </div>

          {error ? (
            <div style={{ color: '#d32f2f', background: '#fff', padding: 16, borderRadius: 4, marginBottom: 8 }}>
              {error}
            </div>
          ) : null}

          {items.length === 0 ? (
            <div style={{ background: '#fff', padding: 48, textAlign: 'center', borderRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
              <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>Your cart is empty</div>
              <div style={{ color: '#878787', marginBottom: 24 }}>Add products to proceed with Flipkart checkout.</div>
              <Link href="/products" style={{ padding: '12px 32px', background: '#2874f0', color: '#fff', borderRadius: 2, fontWeight: 600 }}>
                Shop now
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product_id} className="cart-item">
                <Link href={`/product/${item.product_id}`}>
                  <img className="cart-item__img" src={item.thumbnail} alt={item.title} />
                </Link>
                <div className="cart-item__info">
                  <Link href={`/product/${item.product_id}`}>
                    <div className="cart-item__title">{item.title}</div>
                  </Link>
                  {item.brand ? <div className="cart-item__brand">{item.brand}</div> : null}
                  <div className="cart-item__price-row">
                    <span className="product-card__price">₹{item.price.toFixed(0)}</span>
                    {item.slashed_price && item.slashed_price > item.price ? (
                      <span className="product-card__slashed">₹{item.slashed_price.toFixed(0)}</span>
                    ) : null}
                    {item.discount_percentage ? (
                      <span className="product-card__discount">{Math.round(item.discount_percentage)}% off</span>
                    ) : null}
                  </div>
                  <div className="cart-item__status">
                    {item.quantity > 1 ? 'Ready to ship' : 'Fast delivery available'}
                  </div>
                  <div className="cart-item__actions">
                    <div className="cart-item__qty">
                      <button type="button" onClick={() => handleQtyChange(item.product_id, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => handleQtyChange(item.product_id, item.quantity + 1)}>+</button>
                    </div>
                    <button className="cart-item__remove" onClick={() => handleQtyChange(item.product_id, 0)}>
                      Remove
                    </button>
                    <button className="cart-item__save">Save for later</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 ? (
          <aside className="cart-summary">
            <div className="cart-summary__title">Price Details</div>
            <div className="cart-summary__row">
              <span>Price ({cart?.item_count || 0} items)</span>
              <span>₹{subtotal.toFixed(0)}</span>
            </div>
            <div className="cart-summary__row">
              <span>Discount</span>
              <span style={{ color: '#388e3c' }}>-₹{totalSavings.toFixed(0)}</span>
            </div>
            <div className="cart-summary__row">
              <span>Delivery Charges</span>
              <span style={{ color: '#388e3c', fontWeight: 600 }}>FREE</span>
            </div>
            <div className="cart-summary__total">
              <span>Total Amount</span>
              <span>₹{subtotal.toFixed(0)}</span>
            </div>
            <div className="cart-summary__safe">
              Safe and secure payments. Easy returns. 100% authentic products.
            </div>
            <Link href="/checkout" style={{ display: 'block', textDecoration: 'none' }}>
              <button className="cart-summary__checkout" style={{ width: '100%' }}>
                Place Order
              </button>
            </Link>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
