'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard/ProductCard';
import { ChevronDownIcon } from '@/components/icons/FlipkartIcons';
import { searchProducts } from '@/lib/api';
import type { Product } from '@/lib/types';

const HERO_THEMES = [
  {
    category: 'smartphones',
    badge: 'Big Saving Days',
    title: 'Smartphone upgrades made easy',
    subtitle: 'Exchange offers, no-cost EMI and flagship deals from every top brand.',
    cta: 'Shop mobiles',
    tones: ['#0a4eb6', '#1c82ff'],
    glow: '#b6dbff',
  },
  {
    category: 'laptops',
    badge: 'Work + Play',
    title: 'Laptop picks for college, work and gaming',
    subtitle: 'Thin and light notebooks, creator machines and binge-ready displays.',
    cta: 'Explore laptops',
    tones: ['#0c344f', '#17627d'],
    glow: '#a7f0ff',
  },
  {
    category: 'womens-dresses',
    badge: 'Trend Drop',
    title: 'Fresh fashion finds for the season',
    subtitle: 'Statement dresses, effortless fits and trending looks at everyday prices.',
    cta: 'Shop fashion',
    tones: ['#a5144d', '#ff5f7e'],
    glow: '#ffd6e4',
  },
];

const SIDE_BANNER_THEMES = [
  {
    title: 'Home refresh deals',
    subtitle: 'Furniture, decor and daily utility upgrades',
    category: 'home-decoration',
    accent: 'From ₹699',
    tone: '#fff3d5',
  },
  {
    title: 'Beauty top-rated picks',
    subtitle: 'Serums, fragrances and glow-up essentials',
    category: 'beauty',
    accent: 'Up to 60% off',
    tone: '#ffe5ef',
  },
];

const MINI_BANNERS = [
  {
    title: 'Trending styles',
    subtitle: 'Fashion essentials for every day',
    category: 'tops',
    accent: 'Fresh arrivals',
    tone: '#eff6ff',
  },
  {
    title: 'Kitchen must-haves',
    subtitle: 'Cookware and tools for your home',
    category: 'kitchen-accessories',
    accent: 'Grab or Gone',
    tone: '#fdf4dc',
  },
  {
    title: 'Audio and accessories',
    subtitle: 'Cases, chargers and listening gear',
    category: 'mobile-accessories',
    accent: 'Top rated',
    tone: '#eefdf8',
  },
  {
    title: 'Daily essentials',
    subtitle: 'Beauty, groceries and personal care',
    category: 'groceries',
    accent: 'Budget picks',
    tone: '#fff3f0',
  },
];

interface MerchCard {
  id: string;
  title: string;
  subtitle: string;
  label: string;
  image: string;
}

function buildMerchCards(
  products: Product[],
  labelType: 'discount' | 'tag' | 'price',
): MerchCard[] {
  return products.map((product) => ({
    id: product.id,
    title: product.title.split(' ').slice(0, 3).join(' '),
    subtitle:
      labelType === 'discount'
        ? `Up to ${Math.max(15, Math.round(product.discount_percentage))}% Off`
        : labelType === 'price'
          ? `From ₹${product.price.toFixed(0)}`
          : product.badges?.[0] || 'Top Rated',
    label:
      product.tags?.[0]?.replace(/-/g, ' ') ||
      product.brand ||
      product.category.replace(/-/g, ' '),
    image: product.thumbnail || product.images[0],
  }));
}

function MerchStrip({ title, cards }: { title: string; cards: MerchCard[] }) {
  return (
    <section className="merch-strip">
      <div className="merch-strip__header">{title}</div>
      <div className="merch-strip__grid">
        {cards.map((card) => (
          <Link key={card.id} href={`/product/${card.id}`} className="merch-strip__card">
            <div className="merch-strip__image-wrap">
              <img src={card.image} alt={card.title} />
            </div>
            <div className="merch-strip__accent">{card.subtitle}</div>
            <div className="merch-strip__title">{card.title}</div>
            <div className="merch-strip__label">{card.label}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function SponsoredGrid({ products }: { products: Product[] }) {
  return (
    <section className="sponsored-grid">
      <h2>Sponsored</h2>
      <div className="sponsored-grid__list">
        {products.map((product) => (
          <Link key={product.id} href={`/product/${product.id}`} className="sponsored-grid__card">
            <span className="sponsored-grid__badge">AD</span>
            <img src={product.thumbnail || product.images[0]} alt={product.title} />
            <div className="sponsored-grid__offer">
              {product.discount_percentage > 0
                ? `Up to ${Math.max(20, Math.round(product.discount_percentage))}% Off`
                : `From ₹${product.price.toFixed(0)}`}
            </div>
            <div className="sponsored-grid__title">
              {product.title.split(' ').slice(0, 4).join(' ')}
            </div>
            <div className="sponsored-grid__subtitle">
              {product.tags?.[0]?.replace(/-/g, ' ') || product.category.replace(/-/g, ' ')}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ShelfRow({
  title,
  subtitle,
  href,
  products,
}: {
  title: string;
  subtitle: string;
  href: string;
  products: Product[];
}) {
  return (
    <section className="home-shelf">
      <div className="home-shelf__header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <Link href={href} className="home-shelf__cta">
          View All
        </Link>
      </div>
      <div className="home-shelf__grid">
        {products.map((product) => (
          <Link key={product.id} href={`/product/${product.id}`} className="home-shelf__item">
            <div className="home-shelf__image-wrap">
              <img src={product.thumbnail || product.images[0]} alt={product.title} />
            </div>
            <div className="home-shelf__title">{product.title}</div>
            <div className="home-shelf__price-row">
              <span className="home-shelf__price">₹{product.price.toFixed(0)}</span>
              <span className="home-shelf__discount">
                {Math.max(10, Math.round(product.discount_percentage))}% off
              </span>
            </div>
            <div className="home-shelf__meta">
              {product.brand || product.category.replace(/-/g, ' ')}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function pickCategoryProducts(
  products: Product[],
  category: string,
  count: number,
  fallbackOffset = 0,
) {
  const matches = products.filter((product) => product.category === category).slice(0, count);
  if (matches.length === count) {
    return matches;
  }

  const extras = products
    .filter((product) => product.category !== category)
    .slice(fallbackOffset, fallbackOffset + (count - matches.length));

  return [...matches, ...extras];
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeHero, setActiveHero] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        const data = await searchProducts({ limit: 200 });
        if (!cancelled) {
          setProducts(data);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
        }
      }
    };

    loadProducts().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!HERO_THEMES.length) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveHero((current) => (current + 1) % HERO_THEMES.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, []);

  const heroSlides = useMemo(
    () =>
      HERO_THEMES.map((theme) => ({
        ...theme,
        product: pickCategoryProducts(products, theme.category, 1)[0],
      })).filter((slide) => slide.product),
    [products],
  );

  const sidePromos = useMemo(
    () =>
      SIDE_BANNER_THEMES.map((theme) => ({
        ...theme,
        product: pickCategoryProducts(products, theme.category, 1)[0],
      })).filter((card) => card.product),
    [products],
  );

  const miniPromos = useMemo(
    () =>
      MINI_BANNERS.map((theme, index) => ({
        ...theme,
        product: pickCategoryProducts(products, theme.category, 1, index)[0],
      })).filter((card) => card.product),
    [products],
  );

  const heroSlide = heroSlides[activeHero % Math.max(heroSlides.length, 1)];
  const grabOrGone = products
    .filter((product) => product.badges?.some((badge) => badge.toLowerCase().includes('grab')))
    .slice(0, 8);
  const hotDeals = [...products]
    .sort((left, right) => right.discount_percentage - left.discount_percentage)
    .slice(0, 12);
  const sponsoredProducts = [...products]
    .filter(
      (product) =>
        product.badges?.includes('Flipkart Assured') || (product.customer_rating || 0) >= 4,
    )
    .slice(0, 6);
  const trendCards = buildMerchCards(
    [
      ...pickCategoryProducts(products, 'womens-dresses', 2),
      ...pickCategoryProducts(products, 'womens-bags', 1, 1),
      ...pickCategoryProducts(products, 'beauty', 1, 2),
    ].slice(0, 4),
    'tag',
  );
  const interestingCards = buildMerchCards(
    [
      ...pickCategoryProducts(products, 'mobile-accessories', 1),
      ...pickCategoryProducts(products, 'sports-accessories', 1, 1),
      ...pickCategoryProducts(products, 'tops', 1, 2),
      ...pickCategoryProducts(products, 'fragrances', 1, 3),
    ].slice(0, 4),
    'tag',
  );
  const lowestPriceCards = buildMerchCards(
    [
      ...pickCategoryProducts(products, 'kitchen-accessories', 1),
      ...pickCategoryProducts(products, 'home-decoration', 1, 1),
      ...pickCategoryProducts(products, 'groceries', 1, 2),
      ...pickCategoryProducts(products, 'smartphones', 1, 3),
    ].slice(0, 4),
    'discount',
  );

  return (
    <div className="container home-page">
      {heroSlide ? (
        <section className="hero-showcase">
          <Link
            href={`/products?category=${heroSlide.category}`}
            className="hero-showcase__main"
            style={{
              background: `linear-gradient(135deg, ${heroSlide.tones[0]}, ${heroSlide.tones[1]})`,
            }}
          >
            <div className="hero-showcase__copy">
              <span className="hero-showcase__badge">{heroSlide.badge}</span>
              <h1>{heroSlide.title}</h1>
              <p>{heroSlide.subtitle}</p>
              <div className="hero-showcase__cta-row">
                <span className="hero-showcase__cta">{heroSlide.cta}</span>
                <div className="hero-showcase__dots">
                  {heroSlides.map((slide, index) => (
                    <button
                      key={slide.category}
                      type="button"
                      className={`hero-showcase__dot ${index === activeHero ? 'hero-showcase__dot--active' : ''}`}
                      onClick={(event) => {
                        event.preventDefault();
                        setActiveHero(index);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="hero-showcase__visual">
              <div className="hero-showcase__offer-card">
                <span>Top offer</span>
                <strong>From ₹{heroSlide.product.price.toFixed(0)}</strong>
                <small>
                  {heroSlide.product.brand || heroSlide.product.category.replace(/-/g, ' ')}
                </small>
              </div>
              <div
                className="hero-showcase__glow"
                style={{ background: heroSlide.glow }}
              />
              <img
                src={heroSlide.product.thumbnail || heroSlide.product.images[0]}
                alt={heroSlide.product.title}
                className="hero-showcase__image"
              />
            </div>
          </Link>

          <div className="hero-showcase__side">
            {sidePromos.map((promo) => (
              <Link
                key={promo.title}
                href={`/products?category=${promo.category}`}
                className="hero-side-card"
                style={{ background: promo.tone }}
              >
                <div>
                  <span className="hero-side-card__accent">{promo.accent}</span>
                  <h3>{promo.title}</h3>
                  <p>{promo.subtitle}</p>
                </div>
                <img
                  src={promo.product.thumbnail || promo.product.images[0]}
                  alt={promo.product.title}
                />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mini-banners">
        {miniPromos.map((promo) => (
          <Link
            key={promo.title}
            href={`/products?category=${promo.category}`}
            className="mini-banner"
            style={{ background: promo.tone }}
          >
            <div className="mini-banner__copy">
              <span>{promo.accent}</span>
              <h3>{promo.title}</h3>
              <p>{promo.subtitle}</p>
            </div>
            <div className="mini-banner__visual">
              <img src={promo.product.thumbnail || promo.product.images[0]} alt={promo.product.title} />
            </div>
          </Link>
        ))}
      </section>

      {grabOrGone.length > 0 ? (
        <section className="grab-showcase">
          <div className="grab-showcase__header">
            <div>
              <h2>Grab or Gone</h2>
              <p>Low-stock deals styled like Flipkart urgency slots.</p>
            </div>
            <Link href="/products" className="grab-showcase__cta">
              View all
            </Link>
          </div>
          <div className="grab-showcase__row">
            {grabOrGone.map((product) => (
              <Link key={product.id} href={`/product/${product.id}`} className="grab-showcase__card">
                <img src={product.thumbnail || product.images[0]} alt={product.title} />
                <div className="grab-showcase__title">{product.title}</div>
                <div className="grab-showcase__price">₹{product.price.toFixed(0)}</div>
                <div className="grab-showcase__stock">
                  Hurry, only {Math.max(2, product.stock || 3)} left
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {sponsoredProducts.length > 0 ? <SponsoredGrid products={sponsoredProducts} /> : null}

      {trendCards.length === 4 ? <MerchStrip title="Trends you may like" cards={trendCards} /> : null}
      {interestingCards.length === 4 ? <MerchStrip title="Interesting finds" cards={interestingCards} /> : null}
      {lowestPriceCards.length === 4 ? <MerchStrip title="Lowest Prices in the year" cards={lowestPriceCards} /> : null}

      <ShelfRow
        title="Best of Electronics"
        subtitle="Mobiles, laptops and accessories that are trending right now"
        href="/products?category=smartphones"
        products={[
          ...pickCategoryProducts(products, 'smartphones', 3),
          ...pickCategoryProducts(products, 'laptops', 2, 1),
          ...pickCategoryProducts(products, 'mobile-accessories', 1, 2),
        ].slice(0, 6)}
      />

      <ShelfRow
        title="Fashion's Top Deals"
        subtitle="Statement pieces, daily staples and footwear picks"
        href="/products?category=womens-dresses"
        products={[
          ...pickCategoryProducts(products, 'womens-dresses', 2),
          ...pickCategoryProducts(products, 'tops', 2, 1),
          ...pickCategoryProducts(products, 'mens-shirts', 1, 2),
          ...pickCategoryProducts(products, 'womens-shoes', 1, 3),
        ].slice(0, 6)}
      />

      <ShelfRow
        title="Home & Kitchen Essentials"
        subtitle="Cookware, home decor and utility picks for everyday use"
        href="/products?category=kitchen-accessories"
        products={[
          ...pickCategoryProducts(products, 'kitchen-accessories', 2),
          ...pickCategoryProducts(products, 'home-decoration', 2, 1),
          ...pickCategoryProducts(products, 'furniture', 2, 2),
        ].slice(0, 6)}
      />

      <section className="home-recommendations">
        <div className="home-shelf__header">
          <div>
            <h2>Recommended for you</h2>
            <p>More products, denser merchandising and a cleaner Flipkart-like feed</p>
          </div>
          <Link href="/products" className="home-shelf__cta">
            Browse all
          </Link>
        </div>
        <div className="product-grid">
          {hotDeals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <div className="home-footer-note">
        <span>Recently refreshed</span>
        <ChevronDownIcon size={12} />
      </div>
    </div>
  );
}
