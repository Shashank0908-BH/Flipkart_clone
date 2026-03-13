'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getOrder } from '@/lib/api';
import type { OrderSummary } from '@/lib/types';

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadOrder = async () => {
      try {
        const data = await getOrder(orderId);
        if (!cancelled) {
          setOrder(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load order');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadOrder().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) {
    return <div className="container" style={{ padding: 48, textAlign: 'center' }}>Loading order confirmation...</div>;
  }

  if (!order) {
    return <div className="container" style={{ padding: 48, textAlign: 'center', color: '#d32f2f' }}>{error || 'Order not found'}</div>;
  }

  return (
    <div className="container" style={{ maxWidth: 960, paddingTop: 24, paddingBottom: 48 }}>
      <section className="order-confirmation">
        <div className="order-confirmation__badge">Order confirmed</div>
        <h1 className="order-confirmation__title">Your Flipkart order has been placed</h1>
        <p className="order-confirmation__subtitle">
          Order ID: <strong>{order.id}</strong>
        </p>
        <div className="order-confirmation__actions">
          <Link href="/orders" className="order-confirmation__link">
            View all orders
          </Link>
          <Link href="/products" className="order-confirmation__link order-confirmation__link--primary">
            Continue shopping
          </Link>
        </div>
      </section>

      <div className="order-confirmation__grid">
        <section className="order-confirmation__panel">
          <h2>Items in this order</h2>
          {order.items.map((item, index) => (
            <div key={`${order.id}-${index}`} className="order-confirmation__item">
              <img src={item.thumbnail} alt={item.title} />
              <div>
                <div className="order-confirmation__item-title">{item.title}</div>
                <div className="order-confirmation__item-meta">
                  Qty {item.quantity} • ₹{item.price.toFixed(0)}
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="order-confirmation__panel">
          <h2>Delivery details</h2>
          <div className="order-confirmation__detail">
            <span>Total paid</span>
            <strong>₹{order.total_amount.toFixed(0)}</strong>
          </div>
          <div className="order-confirmation__detail">
            <span>Status</span>
            <strong>{order.status}</strong>
          </div>
          {order.shipping_address && (
            <div className="order-confirmation__address">
              <strong>{order.shipping_address.full_name}</strong>
              <span>{order.shipping_address.address_line_1}</span>
              {order.shipping_address.address_line_2 ? (
                <span>{order.shipping_address.address_line_2}</span>
              ) : null}
              <span>
                {order.shipping_address.locality}, {order.shipping_address.city},{' '}
                {order.shipping_address.state} - {order.shipping_address.pincode}
              </span>
              <span>{order.shipping_address.phone}</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
