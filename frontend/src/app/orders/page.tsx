'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getOrders } from '@/lib/api';
import type { OrderSummary } from '@/lib/types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadOrders = async () => {
      try {
        const data = await getOrders();
        if (!cancelled) {
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
    return <div className="container" style={{ padding: 48, textAlign: 'center', color: '#878787' }}>Loading orders...</div>;
  }

  if (error) {
    return <div className="container" style={{ padding: 48, textAlign: 'center', color: '#d32f2f' }}>{error}</div>;
  }

  return (
    <div className="container" style={{ maxWidth: 980, paddingTop: 24, paddingBottom: 48 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 24 }}>My Orders</h1>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, background: '#fff', borderRadius: 4 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>No orders yet</div>
          <div style={{ color: '#878787', fontSize: 14, marginBottom: 24 }}>
            Looks like you haven&apos;t placed any orders.
          </div>
          <Link href="/products" style={{ background: '#2874f0', color: '#fff', padding: '12px 32px', borderRadius: 2, fontWeight: 600, textDecoration: 'none' }}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map((order) => (
            <Link key={order.id} href={`/order-confirmation/${order.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: '#fff', borderRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #f0f0f0', background: '#f8f8f8' }}>
                  <div>
                    <span style={{ fontSize: 13, color: '#878787' }}>Order ID: </span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{order.id}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      background: '#e8f5e9',
                      color: '#388e3c',
                    }}>
                      {order.status}
                    </span>
                    <span style={{ fontSize: 18, fontWeight: 600 }}>₹{order.total_amount.toFixed(0)}</span>
                  </div>
                </div>
                <div style={{ padding: '16px 24px' }}>
                  {order.items.map((item, idx) => (
                    <div key={`${order.id}-${idx}`} style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: idx < order.items.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                      <img src={item.thumbnail} alt={item.title} style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 4 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{item.title}</div>
                        <div style={{ fontSize: 13, color: '#878787' }}>
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
