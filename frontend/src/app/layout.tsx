'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header/Header';
import MegaMenu from '@/components/MegaMenu/MegaMenu';
import Footer from '@/components/Footer/Footer';
import AuthModal from '@/components/AuthModal/AuthModal';
import { getCart, getDefaultSession, getWishlist } from '@/lib/api';
import {
  CART_UPDATED_EVENT,
  SESSION_UPDATED_EVENT,
  clearSession,
  getSession,
  getSessionUserName,
  isGuestSessionUser,
  storeSession,
} from '@/lib/session';
import type { SessionUser } from '@/lib/types';
import { storeWishlistIds } from '@/lib/wishlist';
import '@/styles/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [showAuth, setShowAuth] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [sessionReady, setSessionReady] = useState(false);
  const router = useRouter();

  const syncSessionState = () => {
    const session = getSession();
    const authenticated = Boolean(session && !isGuestSessionUser(session.user));
    setIsLoggedIn(authenticated);
    setUserName(authenticated ? getSessionUserName() : '');
  };

  const refreshCartCount = async () => {
    try {
      const data = await getCart();
      setCartCount(data.item_count || 0);
    } catch {
      setCartCount(0);
    }
  };

  const refreshWishlistState = async () => {
    try {
      const items = await getWishlist();
      storeWishlistIds(items.map((item) => item.product_id));
    } catch {
      // Leave the current cache in place if the sync fails temporarily.
    }
  };

  useEffect(() => {
    let cancelled = false;

    const bootstrapSession = async () => {
      try {
        if (!getSession()) {
          const fallbackSession = await getDefaultSession();
          storeSession(fallbackSession.access_token, fallbackSession.user);
        }
      } catch {
        // Keep the shell usable even if auth bootstrap is temporarily unavailable.
      } finally {
        if (!cancelled) {
          syncSessionState();
          await Promise.all([refreshCartCount(), refreshWishlistState()]);
          setSessionReady(true);
        }
      }
    };

    const handleSessionUpdate = () => {
      syncSessionState();
      refreshCartCount().catch(() => {});
      refreshWishlistState().catch(() => {});
    };

    const handleCartUpdate = () => {
      refreshCartCount().catch(() => {});
    };

    bootstrapSession().catch(() => {});
    window.addEventListener(SESSION_UPDATED_EVENT, handleSessionUpdate);
    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener(SESSION_UPDATED_EVENT, handleSessionUpdate);
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdate);
    };
  }, []);

  const handleSearch = (query: string) => {
    router.push(`/products?q=${encodeURIComponent(query)}`);
  };

  const handleLogin = (token: string, user: SessionUser) => {
    storeSession(token, user);
    setShowAuth(false);
  };

  const handleLogout = async () => {
    clearSession();

    try {
      const fallbackSession = await getDefaultSession();
      storeSession(fallbackSession.access_token, fallbackSession.user);
    } catch {
      syncSessionState();
      await refreshCartCount();
    }
  };

  return (
    <html lang="en">
      <head>
        <title>Flipkart Clone — Online Shopping</title>
        <meta
          name="description"
          content="Flipkart Clone — shop electronics, groceries, fashion, home and more with Flipkart-style discovery and checkout."
        />
      </head>
      <body>
        <Header
          cartCount={cartCount}
          isLoggedIn={isLoggedIn}
          userName={userName}
          onLoginClick={() => setShowAuth(true)}
          onLogoutClick={() => {
            handleLogout().catch(() => {});
          }}
          onSearch={handleSearch}
        />
        <Suspense fallback={null}>
          <MegaMenu />
        </Suspense>
        <main style={{ minHeight: '60vh' }}>
          {sessionReady ? (
            children
          ) : (
            <div className="container" style={{ padding: '48px 16px', textAlign: 'center' }}>
              Setting up your Flipkart session...
            </div>
          )}
        </main>
        <Footer />
        {showAuth && (
          <AuthModal
            onClose={() => setShowAuth(false)}
            onLogin={handleLogin}
          />
        )}
      </body>
    </html>
  );
}
