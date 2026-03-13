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
      { label: 'Wishlist', href: '/products', Icon: HeartIcon },
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

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
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

  const openAccountMenu = () => setOpenMenu('account');
  const openMoreMenu = () => setOpenMenu('more');
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
            onMouseEnter={openAccountMenu}
            onMouseLeave={closeMenus}
          >
            <button
              type="button"
              className={`fk-header__action fk-header__action--active ${openMenu === 'account' ? 'fk-header__action--open' : ''}`}
              onClick={() => toggleMenu('account')}
            >
              <UserIcon className="fk-header__action-icon" size={19} />
              <span className="fk-header__action-label">{isLoggedIn ? userName || 'Account' : 'Login'}</span>
              <ChevronDownIcon
                className={`fk-header__action-caret ${openMenu === 'account' ? 'fk-header__action-caret--open' : ''}`}
                size={12}
              />
            </button>

            {openMenu === 'account' ? (
              <div className="fk-dropdown fk-dropdown--account">
                <div className="fk-dropdown__top">
                  {isLoggedIn ? (
                    <>
                      <span className="fk-dropdown__eyebrow">Hello, {userName || 'Shopper'}</span>
                      <Link href="/orders" className="fk-dropdown__top-link" onClick={closeMenus}>
                        My Profile
                      </Link>
                    </>
                  ) : (
                    <>
                      <span className="fk-dropdown__eyebrow">New customer?</span>
                      <button type="button" className="fk-dropdown__top-link" onClick={handleLoginAction}>
                        Sign Up
                      </button>
                    </>
                  )}
                </div>

                {!isLoggedIn ? (
                  <button type="button" className="fk-dropdown__primary" onClick={handleLoginAction}>
                    Login / Sign Up
                  </button>
                ) : null}

                <div className="fk-dropdown__list">
                  {accountItems.map(({ label, href, Icon }) => (
                    isLoggedIn ? (
                      <Link key={label} href={href} className="fk-dropdown__item" onClick={closeMenus}>
                        <Icon className="fk-dropdown__icon" size={17} />
                        <span>{label}</span>
                      </Link>
                    ) : (
                      <button key={label} type="button" className="fk-dropdown__item" onClick={handleLoginAction}>
                        <Icon className="fk-dropdown__icon" size={17} />
                        <span>{label}</span>
                      </button>
                    )
                  ))}
                </div>

                {isLoggedIn ? (
                  <>
                    <div className="fk-dropdown__divider" />
                    <button type="button" className="fk-dropdown__item" onClick={handleLogoutAction}>
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
            onMouseEnter={openMoreMenu}
            onMouseLeave={closeMenus}
          >
            <button
              type="button"
              className={`fk-header__action fk-header__action--plain ${openMenu === 'more' ? 'fk-header__action--open' : ''}`}
              onClick={() => toggleMenu('more')}
            >
              <span className="fk-header__action-label">More</span>
              <ChevronDownIcon
                className={`fk-header__action-caret ${openMenu === 'more' ? 'fk-header__action-caret--open' : ''}`}
                size={12}
              />
            </button>

            {openMenu === 'more' ? (
              <div className="fk-dropdown fk-dropdown--more">
                <div className="fk-dropdown__list">
                  {moreItems.map(({ label, href, Icon }) => (
                    <Link key={label} href={href} className="fk-dropdown__item" onClick={closeMenus}>
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
