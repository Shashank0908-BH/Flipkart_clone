#!/usr/bin/env node

const REQUIRED_URL_KEYS = [
  "FRONTEND_URL",
  "CATALOG_URL",
  "INVENTORY_URL",
  "CART_URL",
  "AUTH_URL",
  "ORDERS_URL",
];

const PAYMENT_METHOD = process.env.PAYMENT_METHOD || "UPI";
const RUN_OTP_CHECK = process.env.RUN_OTP_CHECK === "1";
const REQUEST_TIMEOUT_MS = Number.parseInt(
  process.env.SMOKE_TIMEOUT_MS || "20000",
  10,
);

if (typeof fetch !== "function") {
  console.error("Node fetch is not available. Use Node 18+ to run this script.");
  process.exit(1);
}

function normalizeUrl(value) {
  return value ? value.replace(/\/+$/, "") : "";
}

const urls = {
  frontend: normalizeUrl(process.env.FRONTEND_URL),
  catalog: normalizeUrl(
    process.env.CATALOG_URL || process.env.NEXT_PUBLIC_CATALOG_URL,
  ),
  inventory: normalizeUrl(
    process.env.INVENTORY_URL || process.env.NEXT_PUBLIC_INVENTORY_URL,
  ),
  cart: normalizeUrl(process.env.CART_URL || process.env.NEXT_PUBLIC_CART_URL),
  auth: normalizeUrl(process.env.AUTH_URL || process.env.NEXT_PUBLIC_AUTH_URL),
  orders: normalizeUrl(
    process.env.ORDERS_URL || process.env.NEXT_PUBLIC_ORDERS_URL,
  ),
};

const missing = REQUIRED_URL_KEYS.filter((key) => {
  const normalizedKey = key
    .toLowerCase()
    .replace("_url", "")
    .replace("orders", "orders")
    .replace("auth", "auth");
  return !urls[normalizedKey];
});

if (missing.length > 0) {
  console.error("Missing required environment variables:");
  for (const key of missing) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

function log(step, message) {
  console.log(`[${step}] ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function requestJson(name, url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        `${name} failed with ${response.status}: ${JSON.stringify(payload)}`,
      );
    }

    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

async function requestText(name, url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    const body = await response.text();

    if (!response.ok) {
      throw new Error(`${name} failed with ${response.status}`);
    }

    return body;
  } finally {
    clearTimeout(timeout);
  }
}

async function checkHealth(serviceName, baseUrl) {
  const payload = await requestJson(
    `${serviceName} health`,
    `${baseUrl}/health`,
  );
  assert(payload.status === "ok" || payload.status === "healthy", `${serviceName} returned an unexpected health payload`);
  log("health", `${serviceName} OK`);
}

async function pickInStockProduct() {
  const products = await requestJson(
    "catalog search",
    `${urls.catalog}/api/v1/products/search?limit=8`,
  );
  assert(Array.isArray(products) && products.length > 0, "Catalog search returned no products");

  for (const product of products) {
    if (!product || !product.id) {
      continue;
    }

    const inventory = await requestJson(
      `inventory ${product.id}`,
      `${urls.inventory}/api/v1/inventory/${product.id}`,
    );

    if ((inventory.available_stock || 0) > 0) {
      return { product, inventory };
    }
  }

  throw new Error("No in-stock product was found for the smoke test");
}

async function main() {
  log("start", "Checking health endpoints");
  await checkHealth("frontend", urls.frontend);
  await checkHealth("product-catalog", urls.catalog);
  await checkHealth("inventory-service", urls.inventory);
  await checkHealth("cart-service", urls.cart);
  await checkHealth("auth-service", urls.auth);
  await checkHealth("order-service", urls.orders);

  log("frontend", "Checking storefront pages");
  const homeHtml = await requestText("frontend home", `${urls.frontend}/`);
  assert(
    /Flipkart/i.test(homeHtml),
    "Frontend home page did not contain Flipkart branding",
  );
  await requestText("frontend products page", `${urls.frontend}/products`);

  log("auth", "Bootstrapping default session");
  const session = await requestJson(
    "default session",
    `${urls.auth}/api/v1/auth/default-session`,
    { method: "POST" },
  );
  assert(session.access_token, "Default session did not return an access token");
  assert(
    session.user && session.user.cart_user_id,
    "Default session did not include a cart user id",
  );

  const authHeaders = {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };

  const profile = await requestJson(
    "profile",
    `${urls.auth}/api/v1/users/me`,
    { headers: authHeaders },
  );
  assert(profile.id === session.user.id, "Profile lookup returned the wrong user");

  log("catalog", "Selecting an in-stock product");
  const { product, inventory } = await pickInStockProduct();
  await requestJson(
    "product detail",
    `${urls.catalog}/api/v1/products/${product.id}`,
  );
  log("catalog", `Using product ${product.id} with stock ${inventory.available_stock}`);

  const cartUserId = encodeURIComponent(session.user.cart_user_id);
  await requestJson(
    "clear cart",
    `${urls.cart}/api/v1/cart/?user_id=${cartUserId}`,
    { method: "DELETE" },
  );

  log("cart", "Adding the product to cart");
  const addedCart = await requestJson(
    "add to cart",
    `${urls.cart}/api/v1/cart/items?product_id=${encodeURIComponent(product.id)}&quantity=1&user_id=${cartUserId}`,
    { method: "POST" },
  );
  assert(addedCart.item_count >= 1, "Cart did not contain the added item");

  const targetQuantity = inventory.available_stock > 1 ? 2 : 1;
  const updatedCart = await requestJson(
    "update cart item",
    `${urls.cart}/api/v1/cart/items/${encodeURIComponent(product.id)}?quantity=${targetQuantity}&user_id=${cartUserId}`,
    { method: "PUT" },
  );
  const cartItem = Array.isArray(updatedCart.items)
    ? updatedCart.items.find((item) => item.product_id === product.id)
    : null;
  assert(cartItem, "Updated cart item was not present");
  assert(cartItem.quantity === targetQuantity, "Cart quantity was not updated");

  log("checkout", "Placing an order");
  const checkoutPayload = {
    full_name: "Evaluator Smoke Test",
    phone: "9999999999",
    pincode: "560001",
    locality: "MG Road",
    address_line_1: "1 Demo Street",
    address_line_2: "Near Metro",
    city: "Bengaluru",
    state: "Karnataka",
    landmark: "Smoke Test",
    address_type: "HOME",
    cart_user_id: session.user.cart_user_id,
  };

  const order = await requestJson(
    "checkout",
    `${urls.orders}/api/v1/orders/checkout?payment_method=${encodeURIComponent(PAYMENT_METHOD)}`,
    {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(checkoutPayload),
    },
  );
  assert(order.order_id, "Checkout did not return an order id");

  const orders = await requestJson(
    "orders list",
    `${urls.orders}/api/v1/orders/`,
    { headers: authHeaders },
  );
  assert(
    Array.isArray(orders) && orders.some((entry) => entry.id === order.order_id),
    "Orders list did not contain the new order",
  );

  const orderDetail = await requestJson(
    "order detail",
    `${urls.orders}/api/v1/orders/${encodeURIComponent(order.order_id)}`,
    { headers: authHeaders },
  );
  assert(orderDetail.id === order.order_id, "Order detail returned the wrong order");

  const cartAfterCheckout = await requestJson(
    "cart after checkout",
    `${urls.cart}/api/v1/cart/?user_id=${cartUserId}`,
  );
  assert(
    cartAfterCheckout.item_count === 0,
    "Cart was not cleared after checkout",
  );

  if (RUN_OTP_CHECK) {
    log("auth", "Running optional OTP flow");
    const phoneOrEmail = `evaluator+${Date.now()}@example.com`;
    const otpResult = await requestJson(
      "send otp",
      `${urls.auth}/api/v1/auth/send-otp?phone_or_email=${encodeURIComponent(phoneOrEmail)}`,
      { method: "POST" },
    );
    assert(otpResult.otp, "OTP endpoint did not return a code");

    const otpSession = await requestJson(
      "verify otp",
      `${urls.auth}/api/v1/auth/verify-otp?phone_or_email=${encodeURIComponent(phoneOrEmail)}&otp_code=${encodeURIComponent(otpResult.otp)}`,
      { method: "POST" },
    );
    assert(otpSession.access_token, "OTP verification did not return a token");

    await requestJson(
      "otp profile",
      `${urls.auth}/api/v1/users/me`,
      {
        headers: {
          Authorization: `Bearer ${otpSession.access_token}`,
        },
      },
    );
  }

  log("done", "Smoke test passed");
}

main().catch((error) => {
  console.error("[failed]", error instanceof Error ? error.message : error);
  process.exit(1);
});
