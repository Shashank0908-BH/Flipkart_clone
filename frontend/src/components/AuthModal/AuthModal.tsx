'use client';
import { useState } from 'react';
import { sendOtp, verifyOtp } from '@/lib/api';
import type { SessionUser } from '@/lib/types';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (token: string, user: SessionUser) => void;
}

export default function AuthModal({ onClose, onLogin }: AuthModalProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    if (!phoneOrEmail.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await sendOtp(phoneOrEmail.trim());
      setDevOtp(res.otp);
      setStep('otp');
    } catch {
      setError('Failed to send OTP. Try again.');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await verifyOtp(phoneOrEmail.trim(), otp.trim());
      if (res.access_token) {
        onLogin(res.access_token, res.user);
        onClose();
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch {
      setError('Verification failed. Try again.');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
        {/* Left Panel */}
        <div className="auth-modal__left">
          <div>
            <div className="auth-modal__left-title">
              {step === 'phone' ? 'Login' : 'Verify OTP'}
            </div>
            <div className="auth-modal__left-sub">
              {step === 'phone'
                ? 'Get access to your Orders, Wishlist and Recommendations'
                : `We've sent an OTP to ${phoneOrEmail}`}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="auth-modal__right">
          <button className="auth-modal__close" onClick={onClose}>✕</button>

          {step === 'phone' ? (
            <>
              <input
                className="auth-modal__input"
                placeholder="Enter Phone Number or Email"
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
              />
              <p className="auth-modal__hint">
                By continuing, you agree to Flipkart&apos;s Terms of Use and Privacy Policy.
              </p>
              {error && <p style={{ color: '#ff6161', fontSize: 13, marginBottom: 12 }}>{error}</p>}
              <button className="auth-modal__submit" onClick={handleSendOtp} disabled={loading}>
                {loading ? 'Sending...' : 'Request OTP'}
              </button>
            </>
          ) : (
            <>
              <input
                className="auth-modal__input"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                maxLength={6}
              />
              {devOtp && (
                <p className="auth-modal__hint" style={{ color: '#388e3c', fontWeight: 600 }}>
                  Dev Mode OTP: {devOtp}
                </p>
              )}
              {error && <p style={{ color: '#ff6161', fontSize: 13, marginBottom: 12 }}>{error}</p>}
              <button className="auth-modal__submit" onClick={handleVerifyOtp} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify'}
              </button>
              <p
                style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#2874f0', cursor: 'pointer' }}
                onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
              >
                ← Change number
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
