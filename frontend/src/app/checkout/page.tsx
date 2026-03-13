'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCart, placeOrder } from '@/lib/api';
import type { CartResponse, CheckoutAddress } from '@/lib/types';

const DEFAULT_ADDRESS: CheckoutAddress = {
  full_name: 'Shiv Singh Kanaujia',
  phone: '7905296164',
  pincode: '226012',
  locality: 'Vikram Nagar',
  address_line_1: '548V/436 near RDSO car wash shop',
  address_line_2: 'Near car wash lane',
  city: 'Lucknow',
  state: 'Uttar Pradesh',
  landmark: 'Near RDSO',
  address_type: 'HOME',
};

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(1);
  const [address, setAddress] = useState<CheckoutAddress>(DEFAULT_ADDRESS);
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadCart = async () => {
      try {
        const data = await getCart();
        if (cancelled) {
          return;
        }

        setCart(data);
        if (!data.items.length) {
          router.replace('/cart');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load checkout');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCart().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [router]);

  const updateAddress = <K extends keyof CheckoutAddress>(
    key: K,
    value: CheckoutAddress[K],
  ) => {
    setAddress((current) => ({ ...current, [key]: value }));
  };

  const addressReady =
    address.full_name &&
    address.phone &&
    address.pincode &&
    address.locality &&
    address.address_line_1 &&
    address.city &&
    address.state;

  const totalAmount = (cart?.total || 0) + 7;
  const estimatedSavings =
    cart?.items.reduce((total, item) => {
      const slashed = item.slashed_price || item.price;
      return total + Math.max(0, slashed - item.price) * item.quantity;
    }, 0) || 0;

  const handlePlaceOrder = async () => {
    if (!addressReady) {
      setError('Please complete the delivery address before placing the order.');
      setActiveStep(1);
      return;
    }

    setError('');
    setIsProcessing(true);

    try {
      const response = await placeOrder(address, paymentMethod);
      router.push(`/order-confirmation/${response.order_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container page-state">
        Loading checkout...
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="container page-state">
        {error || 'Checkout is unavailable right now.'}
      </div>
    );
  }

  return (
    <div className="container checkout-layout">
      <div className="checkout-main">
        <section className="checkout-card">
          <div className={`checkout-step ${activeStep === 1 ? 'checkout-step--active' : ''}`}>
            <span className="checkout-step__index">1</span>
            <span>DELIVERY ADDRESS</span>
            {activeStep > 1 && (
              <button className="checkout-step__change" onClick={() => setActiveStep(1)}>
                CHANGE
              </button>
            )}
          </div>
          {activeStep === 1 && (
            <div className="checkout-card__body">
              <div className="checkout-address__grid">
                <input value={address.full_name} onChange={(e) => updateAddress('full_name', e.target.value)} placeholder="Full name" />
                <input value={address.phone} onChange={(e) => updateAddress('phone', e.target.value)} placeholder="Phone number" />
                <input value={address.pincode} onChange={(e) => updateAddress('pincode', e.target.value)} placeholder="Pincode" />
                <input value={address.locality} onChange={(e) => updateAddress('locality', e.target.value)} placeholder="Locality" />
                <input className="checkout-address__wide" value={address.address_line_1} onChange={(e) => updateAddress('address_line_1', e.target.value)} placeholder="Address line 1" />
                <input className="checkout-address__wide" value={address.address_line_2 || ''} onChange={(e) => updateAddress('address_line_2', e.target.value)} placeholder="Address line 2" />
                <input value={address.city} onChange={(e) => updateAddress('city', e.target.value)} placeholder="City" />
                <input value={address.state} onChange={(e) => updateAddress('state', e.target.value)} placeholder="State" />
                <input className="checkout-address__wide" value={address.landmark || ''} onChange={(e) => updateAddress('landmark', e.target.value)} placeholder="Landmark" />
              </div>
              <div className="checkout-chip-row">
                <button
                  className={`checkout-chip ${address.address_type === 'HOME' ? 'checkout-chip--active' : ''}`}
                  onClick={() => updateAddress('address_type', 'HOME')}
                >
                  HOME
                </button>
                <button
                  className={`checkout-chip ${address.address_type === 'WORK' ? 'checkout-chip--active' : ''}`}
                  onClick={() => updateAddress('address_type', 'WORK')}
                >
                  WORK
                </button>
              </div>
              <button
                className="btn btn--buy checkout-step-button checkout-step-button--address"
                onClick={() => setActiveStep(2)}
              >
                DELIVER HERE
              </button>
            </div>
          )}
        </section>

        <section className="checkout-card">
          <div className={`checkout-step ${activeStep === 2 ? 'checkout-step--active' : ''}`}>
            <span className="checkout-step__index">2</span>
            <span>ORDER SUMMARY</span>
            {activeStep > 2 && (
              <button className="checkout-step__change" onClick={() => setActiveStep(2)}>
                CHANGE
              </button>
            )}
          </div>
          {activeStep === 2 && (
            <div className="checkout-card__body">
              {cart.items.map((item) => (
                <article key={item.product_id} className="checkout-item">
                  <img src={item.thumbnail} alt={item.title} className="checkout-item__image" />
                  <div className="checkout-item__content">
                    <div className="checkout-item__title">{item.title}</div>
                    <div className="checkout-item__seller">Seller: RetailNet</div>
                    <div className="checkout-item__price">
                      <span>₹{item.price.toFixed(0)}</span>
                      {item.slashed_price && item.slashed_price > item.price && (
                        <span className="checkout-item__slashed">₹{item.slashed_price.toFixed(0)}</span>
                      )}
                      {item.discount_percentage ? (
                        <span className="checkout-item__discount">{Math.round(item.discount_percentage)}% off</span>
                      ) : null}
                    </div>
                    <div className="checkout-item__qty">Qty: {item.quantity}</div>
                  </div>
                </article>
              ))}
              <div className="checkout-step-actions checkout-step-actions--summary">
                <button
                  className="btn btn--buy checkout-step-button"
                  onClick={() => setActiveStep(3)}
                >
                  CONTINUE
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="checkout-card">
          <div className={`checkout-step ${activeStep === 3 ? 'checkout-step--active' : ''}`}>
            <span className="checkout-step__index">3</span>
            <span>PAYMENT OPTIONS</span>
          </div>
          {activeStep === 3 && (
            <div className="checkout-card__body">
              <div className="checkout-payment__options">
                {[
                  ['UPI', 'Pay using UPI apps'],
                  ['CARD', 'Credit / Debit / ATM Card'],
                  ['NET_BANKING', 'Net Banking'],
                  ['COD', 'Cash on Delivery'],
                ].map(([code, label]) => (
                  <label key={code} className={`checkout-payment__option ${paymentMethod === code ? 'checkout-payment__option--active' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === code}
                      onChange={() => setPaymentMethod(code)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              {paymentMethod === 'CARD' && (
                <div className="checkout-card-form">
                  <input placeholder="Card Number" />
                  <div className="checkout-card-form__row">
                    <input placeholder="MM / YY" />
                    <input placeholder="CVV" type="password" />
                  </div>
                </div>
              )}
              {error && (
                <div className="checkout-error">
                  {error}
                </div>
              )}
              <div className="checkout-step-actions">
                <button
                  className="btn btn--buy checkout-step-button"
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : `PAY ₹${totalAmount.toFixed(0)}`}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <aside className="checkout-sidebar">
        <div className="checkout-sidebar__title">PRICE DETAILS</div>
        <div className="checkout-sidebar__row">
          <span>Price ({cart.items.length} items)</span>
          <span>₹{cart.subtotal.toFixed(0)}</span>
        </div>
        <div className="checkout-sidebar__row">
          <span>Discount</span>
          <span className="checkout-positive">-₹{estimatedSavings.toFixed(0)}</span>
        </div>
        <div className="checkout-sidebar__row">
          <span>Platform Fee</span>
          <span>₹7</span>
        </div>
        <div className="checkout-sidebar__row">
          <span>Delivery Charges</span>
          <span className="checkout-positive">FREE</span>
        </div>
        <div className="checkout-sidebar__total">
          <span>Total Amount</span>
          <span>₹{totalAmount.toFixed(0)}</span>
        </div>
        <div className="checkout-sidebar__savings">
          You&apos;ll save ₹{estimatedSavings.toFixed(0)} on this order
        </div>
      </aside>
    </div>
  );
}
