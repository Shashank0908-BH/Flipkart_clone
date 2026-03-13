'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BagIcon,
  BellIcon,
  BoltIcon,
  CartIcon,
  ChevronDownIcon,
  DownloadIcon,
  GiftIcon,
  HeartIcon,
  LogoMarkIcon,
  LogoutIcon,
  MegaphoneIcon,
  SearchIcon,
  SupportIcon,
  UserIcon,
} from '@/components/icons/FlipkartIcons';

interface HeaderProps {
  cartCount?: number;
  isLoggedIn?: boolean;
  userName?: string;
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  onSearch?: (query: string) => void;
}

type MenuKey = 'account' | 'more' | null;
const ACCOUNT_MENU_ID = 'header-account-menu';
const MORE_MENU_ID = 'header-more-menu';

export default function Header({
  cartCount = 0,
  isLoggedIn = false,
  userName,
  onLoginClick,
  onLogoutClick,
  onSearch,
}: HeaderProps) {
  const [query, setQuery] = useState('');
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  const accountItems = useMemo(
    () => [
      { label: 'My Profile', href: '/orders', Icon: UserIcon },
      { label: 'Flipkart Plus Zone', href: '/products?category=smartphones', Icon: BoltIcon },
      { label: 'Orders', href: '/orders', Icon: BagIcon },
      { label: 'Wishlist', href: '/wishlist', Icon: HeartIcon },
      { label: 'Rewards', href: '/products?category=beauty', Icon: GiftIcon },
      { label: 'Gift Cards', href: '/products?category=groceries', Icon: GiftIcon },
    ],
    [],
  );

  const moreItems = useMemo(
    () => [
      { label: 'Notification Preferences', href: '/orders', Icon: BellIcon },
      { label: '24x7 Customer Care', href: '/orders', Icon: SupportIcon },
      { label: 'Advertise', href: '/products', Icon: MegaphoneIcon },
      { label: 'Download App', href: '/products', Icon: DownloadIcon },
    ],
    [],
  );

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        accountRef.current?.contains(target) ||
        moreRef.current?.contains(target)
      ) {
        return;
      }
      setOpenMenu(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenu(null);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (onSearch && query.trim()) {
      onSearch(query.trim());
      setOpenMenu(null);
    }
  };

  const toggleMenu = (menu: Exclude<MenuKey, null>) => {
    setOpenMenu((current) => (current === menu ? null : menu));
  };

  const closeMenus = () => setOpenMenu(null);

  const handleLoginAction = () => {
    closeMenus();
    onLoginClick?.();
  };

  const handleLogoutAction = () => {
    closeMenus();
    onLogoutClick?.();
  };

  return (
    <header className="fk-header">
      <div className="fk-header__inner">
        <Link href="/" className="fk-header__logo-btn" aria-label="Flipkart home">
          <span className="fk-header__logo-mark">
            <LogoMarkIcon size={36} />
          </span>
          <span className="fk-header__logo-copy">
            <span className="fk-header__logo-title">Flipkart</span>
          </span>
        </Link>

        <form className="fk-search" onSubmit={handleSearch}>
          <SearchIcon className="fk-search__icon" size={20} />
          <input
            className="fk-search__input"
            placeholder="Search for Products, Brands and More"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </form>

        <div className="fk-header__actions">
          <div
            className="fk-header__menu-wrap"
            ref={accountRef}
          >
            <button
              type="button"
              className={`fk-header__action fk-header__action--active ${openMenu === 'account' ? 'fk-header__action--open' : ''}`}
              onClick={() => toggleMenu('account')}
              aria-expanded={openMenu === 'account'}
              aria-controls={ACCOUNT_MENU_ID}
              aria-haspopup="menu"
            >
              <UserIcon className="fk-header__action-icon" size={19} />
              <span className="fk-header__action-label">{isLoggedIn ? userName || 'Account' : 'Login'}</span>
              <ChevronDownIcon
                className={`fk-header__action-caret ${openMenu === 'account' ? 'fk-header__action-caret--open' : ''}`}
                size={12}
              />
            </button>

            {openMenu === 'account' ? (
              <div
                id={ACCOUNT_MENU_ID}
                className="fk-dropdown fk-dropdown--account"
                role="menu"
                aria-label="Account menu"
              >
                <div className="fk-dropdown__top">
                  {isLoggedIn ? (
                    <>
                      <span className="fk-dropdown__eyebrow">Hello, {userName || 'Shopper'}</span>
                      <Link href="/orders" className="fk-dropdown__top-link" onClick={closeMenus} role="menuitem">
                        My Profile
                      </Link>
                    </>
                  ) : (
                    <>
                      <span className="fk-dropdown__eyebrow">New customer?</span>
                      <button type="button" className="fk-dropdown__top-link" onClick={handleLoginAction} role="menuitem">
                        Sign Up
                      </button>
                    </>
                  )}
                </div>

                {!isLoggedIn ? (
                  <button type="button" className="fk-dropdown__primary" onClick={handleLoginAction} role="menuitem">
                    Login / Sign Up
                  </button>
                ) : null}

                <div className="fk-dropdown__list">
                  {accountItems.map(({ label, href, Icon }) => (
                    <Link key={label} href={href} className="fk-dropdown__item" onClick={closeMenus} role="menuitem">
                      <Icon className="fk-dropdown__icon" size={17} />
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>

                {isLoggedIn ? (
                  <>
                    <div className="fk-dropdown__divider" />
                    <button type="button" className="fk-dropdown__item" onClick={handleLogoutAction} role="menuitem">
                      <LogoutIcon className="fk-dropdown__icon" size={17} />
                      <span>Logout</span>
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>

          <div
            className="fk-header__menu-wrap"
            ref={moreRef}
          >
            <button
              type="button"
              className={`fk-header__action fk-header__action--plain ${openMenu === 'more' ? 'fk-header__action--open' : ''}`}
              onClick={() => toggleMenu('more')}
              aria-expanded={openMenu === 'more'}
              aria-controls={MORE_MENU_ID}
              aria-haspopup="menu"
            >
              <span className="fk-header__action-label">More</span>
              <ChevronDownIcon
                className={`fk-header__action-caret ${openMenu === 'more' ? 'fk-header__action-caret--open' : ''}`}
                size={12}
              />
            </button>

            {openMenu === 'more' ? (
              <div
                id={MORE_MENU_ID}
                className="fk-dropdown fk-dropdown--more"
                role="menu"
                aria-label="More menu"
              >
                <div className="fk-dropdown__list">
                  {moreItems.map(({ label, href, Icon }) => (
                    <Link key={label} href={href} className="fk-dropdown__item" onClick={closeMenus} role="menuitem">
                      <Icon className="fk-dropdown__icon" size={17} />
                      <span>{label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <Link href="/cart" className="fk-header__action fk-header__cart">
            <CartIcon className="fk-header__action-icon" size={20} />
            <span className="fk-header__action-label">Cart</span>
            {cartCount > 0 ? <span className="fk-header__cart-count">{cartCount}</span> : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
