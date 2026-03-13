'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  AppliancesIcon,
  AutoAccessoriesIcon,
  BeautyIcon,
  BooksMediaIcon,
  ElectronicsIcon,
  FashionIcon,
  FoodHealthIcon,
  ForYouIcon,
  FurnitureIcon,
  HomeIcon,
  MobileIcon,
  SportsFitnessIcon,
  ToysBabyIcon,
  TwoWheelerIcon,
} from '@/components/icons/FlipkartIcons';

const CATEGORIES = [
  { name: 'For You', href: '/', matchCategory: null, Icon: ForYouIcon },
  { name: 'Fashion', href: '/products?category=womens-dresses', matchCategory: 'womens-dresses', Icon: FashionIcon },
  { name: 'Mobiles', href: '/products?category=smartphones', matchCategory: 'smartphones', Icon: MobileIcon },
  { name: 'Beauty', href: '/products?category=beauty', matchCategory: 'beauty', Icon: BeautyIcon },
  { name: 'Electronics', href: '/products?category=laptops', matchCategory: 'laptops', Icon: ElectronicsIcon },
  { name: 'Home', href: '/products?category=home-decoration', matchCategory: 'home-decoration', Icon: HomeIcon },
  { name: 'Appliances', href: '/products?category=kitchen-accessories', matchCategory: 'kitchen-accessories', Icon: AppliancesIcon },
  { name: 'Toys & Baby', href: '/products?category=sports-accessories', matchCategory: 'sports-accessories', Icon: ToysBabyIcon },
  { name: 'Food & Health', href: '/products?category=groceries', matchCategory: 'groceries', Icon: FoodHealthIcon },
  { name: 'Auto Acc.', href: '/products?category=vehicle', matchCategory: 'vehicle', Icon: AutoAccessoriesIcon },
  { name: '2 Wheelers', href: '/products?category=motorcycle', matchCategory: 'motorcycle', Icon: TwoWheelerIcon },
  { name: 'Sports & Fit', href: '/products?category=sports-accessories', matchCategory: 'sports-accessories', Icon: SportsFitnessIcon },
  { name: 'Books & More', href: '/products?category=tablets', matchCategory: 'tablets', Icon: BooksMediaIcon },
  { name: 'Furniture', href: '/products?category=furniture', matchCategory: 'furniture', Icon: FurnitureIcon },
];

export default function MegaMenu() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category');

  return (
    <nav className="fk-catnav">
      <div className="fk-catnav__inner">
        {CATEGORIES.map(({ name, href, matchCategory, Icon }) => {
          const isActive = matchCategory
            ? activeCategory === matchCategory
            : pathname === '/' && !activeCategory;

          return (
            <Link
              key={name}
              href={href}
              className={`fk-catnav__item ${isActive ? 'fk-catnav__item--active' : ''}`}
            >
              <div className="fk-catnav__img-wrap">
                <Icon size={42} />
              </div>
              <span className="fk-catnav__label">{name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
