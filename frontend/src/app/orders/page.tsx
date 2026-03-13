'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getOrders } from '@/lib/api';
import { hasAuthenticatedSession } from '@/lib/session';
import type { OrderSummary } from '@/lib/types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadOrders = async () => {
      if (!hasAuthenticatedSession()) {
        if (!cancelled) {
          setNeedsLogin(true);
          setOrders([]);
          setError('');
          setLoading(false);
        }
        return;
      }

      try {
        const data = await getOrders();
        if (!cancelled) {
          setNeedsLogin(false);
          setOrders(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load orders');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadOrders().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="container page-state">Loading orders...</div>;
  }

  if (error) {
    return <div className="container page-state page-state--error">{error}</div>;
  }

  if (needsLogin) {
    return (
      <div className="container page-shell--narrow">
        <div className="orders-page__empty">
          <div className="orders-page__empty-icon">🔐</div>
          <div className="orders-page__empty-title">Login to view your orders</div>
          <div className="orders-page__empty-copy">
            Your account order history is available only after you sign in.
          </div>
          <Link href="/products" className="button-link button-link--primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-shell--narrow">
      <h1 className="orders-page__title">My Orders</h1>

      {orders.length === 0 ? (
        <div className="orders-page__empty">
          <div className="orders-page__empty-icon">📦</div>
          <div className="orders-page__empty-title">No orders yet</div>
          <div className="orders-page__empty-copy">
            Looks like you haven&apos;t placed any orders.
          </div>
          <Link href="/products" className="button-link button-link--primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="orders-page__list">
          {orders.map((order) => (
            <Link key={order.id} href={`/order-confirmation/${order.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="orders-page__card">
                <div className="orders-page__card-header">
                  <div>
                    <span className="orders-page__id-label">Order ID: </span>
                    <span className="orders-page__id-value">{order.id}</span>
                  </div>
                  <div className="orders-page__card-meta">
                    <span className="orders-page__status">{order.status}</span>
                    <span className="orders-page__amount">₹{order.total_amount.toFixed(0)}</span>
                  </div>
                </div>
                <div className="orders-page__card-body">
                  {order.items.map((item, idx) => (
                    <div key={`${order.id}-${idx}`} className="orders-page__item">
                      <img src={item.thumbnail} alt={item.title} className="orders-page__item-image" />
                      <div>
                        <div className="orders-page__item-title">{item.title}</div>
                        <div className="orders-page__item-meta">
                          Qty: {item.quantity} × ₹{item.price.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
