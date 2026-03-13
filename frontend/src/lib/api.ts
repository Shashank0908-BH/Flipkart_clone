import {
  emitCartUpdated,
  getCartUserId,
  getSession,
} from "@/lib/session";
import type {
  AuthSessionResponse,
  CartResponse,
  Category,
  CheckoutAddress,
  InventoryStatus,
  OrderSummary,
  Product,
  SessionUser,
} from "@/lib/types";

const API = {
  catalog: process.env.NEXT_PUBLIC_CATALOG_URL || "http://localhost:8000",
  inventory:
    process.env.NEXT_PUBLIC_INVENTORY_URL || "http://localhost:8001",
  cart: process.env.NEXT_PUBLIC_CART_URL || "http://localhost:8002",
  auth: process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8003",
  orders: process.env.NEXT_PUBLIC_ORDERS_URL || "http://localhost:8004",
};

async function parseJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "detail" in payload &&
      typeof payload.detail === "string"
        ? payload.detail
        : "Request failed";

    throw new Error(message);
  }

  return payload as T;
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      return;
    }
    query.set(key, String(value));
  });

  return query.toString();
}

function getAuthHeaders() {
  const session = getSession();
  if (!session) {
    throw new Error("Session not ready");
  }

  return {
    Authorization: `Bearer ${session.token}`,
  };
}

function getSessionUser() {
  return getSession()?.user || null;
}

export async function searchProducts(params: {
  q?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  limit?: number;
}) {
  const query = buildQuery({
    q: params.q,
    category: params.category,
    min_price: params.min_price,
    max_price: params.max_price,
    min_rating: params.min_rating,
    limit: params.limit,
  });

  const response = await fetch(`${API.catalog}/api/v1/products/search?${query}`, {
    cache: "no-store",
  });

  return parseJson<Product[]>(response);
}

export async function getProduct(id: string) {
  const response = await fetch(`${API.catalog}/api/v1/products/${id}`, {
    cache: "no-store",
  });

  return parseJson<Product>(response);
}

export async function getCategories() {
  const response = await fetch(`${API.catalog}/api/v1/categories/`, {
    cache: "force-cache",
  });

  return parseJson<Category[]>(response);
}

export async function getGroupedCategories() {
  const response = await fetch(`${API.catalog}/api/v1/categories/grouped`, {
    cache: "force-cache",
  });

  return parseJson<Record<string, Category[]>>(response);
}

export async function getInventory(id: string) {
  const response = await fetch(`${API.inventory}/api/v1/inventory/${id}`, {
    cache: "no-store",
  });

  return parseJson<InventoryStatus>(response);
}

export async function getCart(userId = getCartUserId()) {
  const response = await fetch(
    `${API.cart}/api/v1/cart/?${buildQuery({ user_id: userId })}`,
    {
      cache: "no-store",
    },
  );

  return parseJson<CartResponse>(response);
}

export async function addToCart(
  productId: string,
  quantity = 1,
  userId = getCartUserId(),
) {
  const response = await fetch(
    `${API.cart}/api/v1/cart/items?${buildQuery({
      product_id: productId,
      quantity,
      user_id: userId,
    })}`,
    { method: "POST" },
  );

  const cart = await parseJson<CartResponse>(response);
  emitCartUpdated();
  return cart;
}

export async function updateCartItem(
  productId: string,
  quantity: number,
  userId = getCartUserId(),
) {
  const response = await fetch(
    `${API.cart}/api/v1/cart/items/${productId}?${buildQuery({
      quantity,
      user_id: userId,
    })}`,
    { method: "PUT" },
  );

  const cart = await parseJson<CartResponse>(response);
  emitCartUpdated();
  return cart;
}

export async function removeCartItem(
  productId: string,
  userId = getCartUserId(),
) {
  const response = await fetch(
    `${API.cart}/api/v1/cart/items/${productId}?${buildQuery({
      user_id: userId,
    })}`,
    { method: "DELETE" },
  );

  const cart = await parseJson<CartResponse>(response);
  emitCartUpdated();
  return cart;
}

export async function clearCart(userId = getCartUserId()) {
  const response = await fetch(
    `${API.cart}/api/v1/cart/?${buildQuery({ user_id: userId })}`,
    { method: "DELETE" },
  );

  const result = await parseJson<{ message: string; user_id: string }>(response);
  emitCartUpdated();
  return result;
}

export async function getDefaultSession() {
  const response = await fetch(`${API.auth}/api/v1/auth/default-session`, {
    method: "POST",
  });

  return parseJson<AuthSessionResponse>(response);
}

export async function sendOtp(phoneOrEmail: string) {
  const response = await fetch(
    `${API.auth}/api/v1/auth/send-otp?${buildQuery({
      phone_or_email: phoneOrEmail,
    })}`,
    { method: "POST" },
  );

  return parseJson<{ message: string; otp: string }>(response);
}

export async function verifyOtp(phoneOrEmail: string, otpCode: string) {
  const response = await fetch(
    `${API.auth}/api/v1/auth/verify-otp?${buildQuery({
      phone_or_email: phoneOrEmail,
      otp_code: otpCode,
    })}`,
    { method: "POST" },
  );

  return parseJson<AuthSessionResponse>(response);
}

export async function getProfile(token?: string) {
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : getAuthHeaders();

  const response = await fetch(`${API.auth}/api/v1/users/me`, {
    headers,
    cache: "no-store",
  });

  return parseJson<SessionUser>(response);
}

export async function getWishlist(token?: string) {
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : getAuthHeaders();

  const response = await fetch(`${API.auth}/api/v1/users/wishlist`, {
    headers,
    cache: "no-store",
  });

  return parseJson<Array<{ id: number; product_id: string; added_at: string }>>(
    response,
  );
}

export async function addToWishlist(productId: string, token?: string) {
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : getAuthHeaders();

  const response = await fetch(
    `${API.auth}/api/v1/users/wishlist?${buildQuery({ product_id: productId })}`,
    {
      method: "POST",
      headers,
    },
  );

  return parseJson<{ message: string }>(response);
}

export async function removeFromWishlist(productId: string, token?: string) {
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : getAuthHeaders();

  const response = await fetch(
    `${API.auth}/api/v1/users/wishlist/${productId}`,
    {
      method: "DELETE",
      headers,
    },
  );

  return parseJson<{ message: string }>(response);
}

export async function placeOrder(
  shippingAddress: CheckoutAddress,
  paymentMethod = "CARD",
) {
  const session = getSession();
  if (!session) {
    throw new Error("Session not ready");
  }

  const response = await fetch(
    `${API.orders}/api/v1/orders/checkout?${buildQuery({
      payment_method: paymentMethod,
    })}`,
    {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...shippingAddress,
        cart_user_id: session.user.cart_user_id,
      }),
    },
  );

  emitCartUpdated();
  return parseJson<{
    message: string;
    order_id: string;
    payment_status: string;
    total_amount: number;
    transaction_id: string;
  }>(response);
}

export async function getOrders() {
  const response = await fetch(`${API.orders}/api/v1/orders/`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  return parseJson<OrderSummary[]>(response);
}

export async function getOrder(orderId: string) {
  const response = await fetch(`${API.orders}/api/v1/orders/${orderId}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  return parseJson<OrderSummary>(response);
}

export function getCurrentSessionUser() {
  return getSessionUser();
}
