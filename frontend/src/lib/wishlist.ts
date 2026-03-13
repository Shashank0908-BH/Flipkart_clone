const WISHLIST_KEY = "fk_wishlist_ids";

export const WISHLIST_UPDATED_EVENT = "fk-wishlist-updated";

function canUseStorage() {
  return typeof window !== "undefined";
}

function dispatchWishlistUpdated() {
  if (!canUseStorage()) {
    return;
  }

  window.dispatchEvent(new CustomEvent(WISHLIST_UPDATED_EVENT));
}

export function getStoredWishlistIds() {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(WISHLIST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return Array.from(
      new Set(
        parsed.filter(
          (item): item is string => typeof item === "string" && item.length > 0,
        ),
      ),
    );
  } catch {
    return [];
  }
}

export function getStoredWishlistSet() {
  return new Set(getStoredWishlistIds());
}

export function isProductWishlisted(productId: string) {
  return getStoredWishlistSet().has(productId);
}

export function storeWishlistIds(productIds: Iterable<string>) {
  if (!canUseStorage()) {
    return;
  }

  const uniqueIds = Array.from(
    new Set(
      Array.from(productIds).filter(
        (item): item is string => typeof item === "string" && item.length > 0,
      ),
    ),
  );
  window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(uniqueIds));
  dispatchWishlistUpdated();
}

export function addStoredWishlistId(productId: string) {
  const nextWishlist = getStoredWishlistSet();
  nextWishlist.add(productId);
  storeWishlistIds(nextWishlist);
}

export function removeStoredWishlistId(productId: string) {
  const nextWishlist = getStoredWishlistSet();
  nextWishlist.delete(productId);
  storeWishlistIds(nextWishlist);
}
