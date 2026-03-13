'use client';

import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

const OUTLINE = '#3b3b3b';
const YELLOW = '#f6d722';
const BLUE = '#2455f4';

function createIcon(viewBox: string, paths: () => ReactNode) {
  return function Icon({ size = 24, ...props }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        {...props}
      >
        {paths()}
      </svg>
    );
  };
}

export const SearchIcon = createIcon('0 0 24 24', function SearchPath() {
  return (
    <>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.9" />
      <path d="M16 16L20 20" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </>
  );
});

export const UserIcon = createIcon('0 0 24 24', function UserPath() {
  return (
    <>
      <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5.4 18.9C6.4 15.8 8.8 14.5 12 14.5C15.2 14.5 17.6 15.8 18.6 18.9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </>
  );
});

export const ChevronDownIcon = createIcon('0 0 12 12', function ChevronDownPath() {
  return (
    <path
      d="M2.2 4.2L6 8L9.8 4.2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
});

export const CartIcon = createIcon('0 0 24 24', function CartPath() {
  return (
    <>
      <path
        d="M3.5 5.3H5.8L7.5 13.4C7.7 14.3 8.4 14.9 9.3 14.9H17.4C18.2 14.9 18.9 14.4 19.2 13.6L20.6 8.7H7.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.7" cy="18.4" r="1.25" fill="currentColor" />
      <circle cx="17.1" cy="18.4" r="1.25" fill="currentColor" />
    </>
  );
});

export const BoltIcon = createIcon('0 0 24 24', function BoltPath() {
  return <path d="M13.2 2.8L6.8 13H11L10.6 21.2L17.2 10.8H13.1L13.2 2.8Z" fill="currentColor" />;
});

export const BagIcon = createIcon('0 0 24 24', function BagPath() {
  return (
    <>
      <path d="M7 8.5H17L18.5 20H5.5L7 8.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9.2 8.5C9.2 6.6 10.3 5 12 5C13.7 5 14.8 6.6 14.8 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  );
});

export const HeartIcon = createIcon('0 0 24 24', function HeartPath() {
  return (
    <path
      d="M20 5.8C18.5 4.2 16 4.2 14.5 5.8L12 8.2L9.5 5.8C8 4.2 5.5 4.2 4 5.8C2.3 7.5 2.3 10.2 4 11.9L12 19.9L20 11.9C21.7 10.2 21.7 7.5 20 5.8Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  );
});

export const GiftIcon = createIcon('0 0 24 24', function GiftPath() {
  return (
    <>
      <rect x="4.5" y="9" width="15" height="10.5" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 12.2H19.5M12 9V19.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.8 8.8C7.7 8.8 6.9 8.1 6.9 7.1C6.9 6 7.7 5.3 8.8 5.3C10.6 5.3 12 7.5 12 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15.2 8.8C16.3 8.8 17.1 8.1 17.1 7.1C17.1 6 16.3 5.3 15.2 5.3C13.4 5.3 12 7.5 12 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  );
});

export const BellIcon = createIcon('0 0 24 24', function BellPath() {
  return (
    <>
      <path d="M7.5 16.8H16.5L15.9 15.6V10.8C15.9 8.5 14.2 6.6 12 6.6C9.8 6.6 8.1 8.5 8.1 10.8V15.6L7.5 16.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10.4 18C10.8 19 11.3 19.5 12 19.5C12.7 19.5 13.2 19 13.6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  );
});

export const SupportIcon = createIcon('0 0 24 24', function SupportPath() {
  return (
    <>
      <path d="M5.8 12.4C5.8 8.9 8.5 6.1 12 6.1C15.5 6.1 18.2 8.9 18.2 12.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="4.4" y="11.6" width="2.8" height="5.2" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="16.8" y="11.6" width="2.8" height="5.2" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15.2 17.1C14.4 18.1 13.2 18.7 12 18.7H10.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  );
});

export const DownloadIcon = createIcon('0 0 24 24', function DownloadPath() {
  return (
    <>
      <path d="M12 5.5V14.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.8 11.8L12 15L15.2 11.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.2 18.2H17.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  );
});

export const MegaphoneIcon = createIcon('0 0 24 24', function MegaphonePath() {
  return (
    <>
      <path d="M5.3 11.2H8.2L15.8 7.8V16.2L8.2 12.8H5.3V11.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8.2 12.8L9.3 17.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17.5 9.2L18.9 8.3M17.5 14.8L18.9 15.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  );
});

export const LogoutIcon = createIcon('0 0 24 24', function LogoutPath() {
  return (
    <>
      <path d="M10.2 6H7.4C6.5 6 5.8 6.7 5.8 7.6V16.4C5.8 17.3 6.5 18 7.4 18H10.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12.2 8.6L15.8 12L12.2 15.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.8 12H9.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  );
});

export const LogoMarkIcon = createIcon('0 0 46 46', function LogoMarkPath() {
  return (
    <>
      <path d="M12 18H18.6" stroke={BLUE} strokeWidth="3.2" strokeLinecap="round" />
      <path d="M10.2 22.2H17" stroke={BLUE} strokeWidth="3.2" strokeLinecap="round" />
      <path
        d="M28.6 8.4C24.5 8.4 22.1 11 22.1 15.3V16.8H18.7V21.1H22.1V36.6H27.5V21.1H32.7L33.7 16.8H27.5V15.8C27.5 13.9 28.2 12.9 29.8 12.9C31 12.9 31.9 13.2 32.7 13.6L34 9.5C32.8 8.9 31.2 8.4 28.6 8.4Z"
        fill={BLUE}
      />
    </>
  );
});

export const ForYouIcon = createIcon('0 0 48 48', function ForYouPath() {
  return (
    <>
      <path d="M13.4 16.2H34.6L33 33.6C32.8 35.3 31.4 36.6 29.7 36.6H18.3C16.6 36.6 15.2 35.3 15 33.6L13.4 16.2Z" stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M18.4 16.2C18.4 12.8 20.8 10.4 24 10.4C27.2 10.4 29.6 12.8 29.6 16.2" stroke={OUTLINE} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M19.2 17.4H28.8V18.2C28.8 22 26.7 24.4 24 24.4C21.3 24.4 19.2 22 19.2 18.2V17.4Z" fill={YELLOW} />
    </>
  );
});

export const FashionIcon = createIcon('0 0 48 48', function FashionPath() {
  return (
    <>
      <path d="M17.2 11.8L24 15.4L30.8 11.8L36.4 17.4L31.8 21V35.2H16.2V21L11.6 17.4L17.2 11.8Z" stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M18.3 31.1H29.7V35.2H18.3V31.1Z" fill={YELLOW} />
    </>
  );
});

export const MobileIcon = createIcon('0 0 48 48', function MobilePath() {
  return (
    <>
      <rect x="16.5" y="10.5" width="15" height="27" rx="3.5" stroke={OUTLINE} strokeWidth="2.2" />
      <path d="M21.3 14.4H26.7" stroke={OUTLINE} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M21.4 33.4H26.6" stroke={YELLOW} strokeWidth="2.6" strokeLinecap="round" />
    </>
  );
});

export const BeautyIcon = createIcon('0 0 48 48', function BeautyPath() {
  return (
    <>
      <path d="M21.4 11.8H26.6V18H21.4V11.8Z" stroke={OUTLINE} strokeWidth="2.2" />
      <path d="M19.8 18H28.2V25.2H19.8V18Z" stroke={OUTLINE} strokeWidth="2.2" />
      <path d="M20.6 12.8L27.4 12.8L27.4 16.2L20.6 16.2Z" fill={YELLOW} />
      <path d="M22 25.2V34.2H26V25.2" stroke={OUTLINE} strokeWidth="2.2" strokeLinecap="round" />
    </>
  );
});

export const ElectronicsIcon = createIcon('0 0 48 48', function ElectronicsPath() {
  return (
    <>
      <rect x="11.6" y="12.6" width="24.8" height="15.8" rx="2.4" stroke={OUTLINE} strokeWidth="2.2" />
      <path d="M16 31.2H32" stroke={OUTLINE} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14.8 29.2H33.2V31.8H14.8V29.2Z" fill={YELLOW} />
    </>
  );
});

export const HomeIcon = createIcon('0 0 48 48', function HomePath() {
  return (
    <>
      <path d="M24 11.2L30.2 22.6H17.8L24 11.2Z" fill={YELLOW} />
      <path d="M24 11.2L30.2 22.6H17.8L24 11.2Z" stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M20.2 22.6H27.8V33.8H20.2V22.6Z" stroke={OUTLINE} strokeWidth="2.2" />
      <path d="M18.2 34.8H29.8" stroke={OUTLINE} strokeWidth="2.2" strokeLinecap="round" />
    </>
  );
});

export const AppliancesIcon = createIcon('0 0 48 48', function AppliancesPath() {
  return (
    <>
      <rect x="10.6" y="13.2" width="26.8" height="15.6" rx="1.8" stroke={OUTLINE} strokeWidth="2.2" />
      <path d="M24 28.8V33" stroke={OUTLINE} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M17.6 33H30.4" stroke={OUTLINE} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M13.6 28.8H34.4V31.2H13.6V28.8Z" fill={YELLOW} />
    </>
  );
});

export const ToysBabyIcon = createIcon('0 0 48 48', function ToysBabyPath() {
  return (
    <>
      <circle cx="18.4" cy="17.2" r="4.2" stroke={OUTLINE} strokeWidth="2.2" />
      <circle cx="29.6" cy="17.2" r="4.2" stroke={OUTLINE} strokeWidth="2.2" />
      <circle cx="24" cy="23.6" r="8.6" stroke={OUTLINE} strokeWidth="2.2" />
      <circle cx="24" cy="25.2" r="3.8" fill={YELLOW} />
      <path d="M21.1 29.3C21.9 30.2 22.9 30.7 24 30.7C25.1 30.7 26.1 30.2 26.9 29.3" stroke={OUTLINE} strokeWidth="2" strokeLinecap="round" />
    </>
  );
});

export const FoodHealthIcon = createIcon('0 0 48 48', function FoodHealthPath() {
  return (
    <>
      <rect x="17.4" y="10.8" width="13.2" height="6.4" rx="2.2" stroke={OUTLINE} strokeWidth="2.2" />
      <path d="M16 17.2H32V34.8C32 36.3 30.8 37.6 29.2 37.6H18.8C17.2 37.6 16 36.3 16 34.8V17.2Z" stroke={OUTLINE} strokeWidth="2.2" />
      <path d="M16.8 22.4H31.2V28.4H16.8V22.4Z" fill={YELLOW} />
    </>
  );
});

export const AutoAccessoriesIcon = createIcon('0 0 48 48', function AutoAccessoriesPath() {
  return (
    <>
      <path d="M14.4 23.8C14.4 17.6 18.8 13 24.2 13C29.8 13 34.2 17.7 34.2 23.8V24.8H14.4V23.8Z" stroke={OUTLINE} strokeWidth="2.2" />
      <path d="M24.2 13C29.4 13 33.4 16.6 33.8 21.4H23.4L21.4 17.6H18.6C19.8 14.8 21.8 13 24.2 13Z" fill={YELLOW} />
      <path d="M17.4 25H31.2L29.4 35H18.8L17.4 25Z" stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round" />
    </>
  );
});

export const TwoWheelerIcon = createIcon('0 0 48 48', function TwoWheelerPath() {
  return (
    <>
      <circle cx="16.2" cy="30.6" r="3.8" stroke={OUTLINE} strokeWidth="2.2" />
      <circle cx="31.8" cy="30.6" r="3.8" stroke={OUTLINE} strokeWidth="2.2" />
      <path d="M20 30.6H28.5L31.5 24.6H24.2L21.4 19.4H18" stroke={OUTLINE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M28.2 20.4H30.8L31.8 23.8" stroke={OUTLINE} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M26 18.2H28.8V20.8H26V18.2Z" fill={YELLOW} />
    </>
  );
});

export const SportsFitnessIcon = createIcon('0 0 48 48', function SportsFitnessPath() {
  return (
    <>
      <path d="M16.8 31.8L26.6 18.2" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
      <path d="M20.2 26.8L23.8 29.4" stroke={OUTLINE} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="30.6" cy="31.2" r="4.4" fill={YELLOW} stroke={OUTLINE} strokeWidth="2.2" />
    </>
  );
});

export const BooksMediaIcon = createIcon('0 0 48 48', function BooksMediaPath() {
  return (
    <>
      <path d="M16.4 12.2H29.6C31.5 12.2 33 13.7 33 15.6V35.8H19.4C17.7 35.8 16.4 34.5 16.4 32.8V12.2Z" stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M27.4 12.2H33V35.8H27.4V12.2Z" fill={YELLOW} />
      <path d="M19.8 17.2H25.4" stroke={OUTLINE} strokeWidth="2.2" strokeLinecap="round" />
    </>
  );
});

export const FurnitureIcon = createIcon('0 0 48 48', function FurniturePath() {
  return (
    <>
      <path d="M14.4 21.4C14.4 17.9 16.8 15.4 19.8 15.4C22.2 15.4 24 17 24 19.4V26H14.4V21.4Z" stroke={OUTLINE} strokeWidth="2.2" />
      <path d="M24 19.8C24 17 26.2 15 28.8 15C31.8 15 34 17.4 34 21V26H24V19.8Z" stroke={OUTLINE} strokeWidth="2.2" />
      <path d="M14.4 24.8H34V32.4H14.4V24.8Z" stroke={OUTLINE} strokeWidth="2.2" />
      <path d="M15.8 32.4V35.8M32.2 32.4V35.8" stroke={OUTLINE} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M24 24.8H34V28H24V24.8Z" fill={YELLOW} />
    </>
  );
});
