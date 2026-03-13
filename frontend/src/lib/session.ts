import type { SessionUser } from "@/lib/types";

const TOKEN_KEY = "fk_token";
const USER_KEY = "fk_user";
const DEFAULT_GUEST_EMAIL = "default@flipkart.local";

export const SESSION_UPDATED_EVENT = "fk-session-updated";
export const CART_UPDATED_EVENT = "fk-cart-updated";

function canUseStorage() {
  return typeof window !== "undefined";
}

function dispatchWindowEvent(name: string) {
  if (!canUseStorage()) {
    return;
  }

  window.dispatchEvent(new CustomEvent(name));
}

function normalizeUser(user: unknown): SessionUser | null {
  if (!user || typeof user !== "object") {
    return null;
  }

  const candidate = user as Partial<SessionUser>;
  if (typeof candidate.id !== "number") {
    return null;
  }

  return {
    id: candidate.id,
    phone: candidate.phone ?? null,
    email: candidate.email ?? null,
    name: candidate.name ?? null,
    cart_user_id:
      candidate.cart_user_id ||
      (candidate.id > 0 ? `user-${candidate.id}` : "user-default"),
  };
}

export function getStoredToken() {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  if (!canUseStorage()) {
    return null;
  }

  const rawUser = window.localStorage.getItem(USER_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return normalizeUser(JSON.parse(rawUser));
  } catch {
    return null;
  }
}

export function storeSession(token: string, user: SessionUser) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  dispatchWindowEvent(SESSION_UPDATED_EVENT);
}

export function clearSession() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  dispatchWindowEvent(SESSION_UPDATED_EVENT);
}

export function getSession() {
  const token = getStoredToken();
  const user = getStoredUser();

  if (!token || !user) {
    return null;
  }

  return { token, user };
}

export function isGuestSessionUser(user?: SessionUser | null) {
  if (!user) {
    return false;
  }

  return (
    user.email === DEFAULT_GUEST_EMAIL ||
    user.cart_user_id === "user-default"
  );
}

export function hasAuthenticatedSession() {
  const session = getSession();
  return Boolean(session && !isGuestSessionUser(session.user));
}

export function getCartUserId() {
  return getStoredUser()?.cart_user_id || "user-default";
}

export function getSessionUserName() {
  const user = getStoredUser();
  return user?.name || user?.phone || user?.email || "Account";
}

export function emitCartUpdated() {
  dispatchWindowEvent(CART_UPDATED_EVENT);
}
