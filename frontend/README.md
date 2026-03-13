# Frontend

Next.js storefront for the Flipkart clone.

## Local env vars

```bash
NEXT_PUBLIC_CATALOG_URL=http://localhost:8000
NEXT_PUBLIC_INVENTORY_URL=http://localhost:8001
NEXT_PUBLIC_CART_URL=http://localhost:8002
NEXT_PUBLIC_AUTH_URL=http://localhost:8003
NEXT_PUBLIC_ORDERS_URL=http://localhost:8004
```

## Evaluator deployment on Vercel

Deploy the `frontend` folder to Vercel and set these production env vars:

```bash
NEXT_PUBLIC_CATALOG_URL=https://<product-catalog-domain>
NEXT_PUBLIC_INVENTORY_URL=https://<inventory-domain>
NEXT_PUBLIC_CART_URL=https://<cart-domain>
NEXT_PUBLIC_AUTH_URL=https://<auth-domain>
NEXT_PUBLIC_ORDERS_URL=https://<orders-domain>
```

Recommended Vercel settings:

- Framework preset: `Next.js`
- Root directory: `frontend`
- Install command: `npm install`
- Build command: `npm run build`

The deployed storefront exposes a health endpoint at `/health`.

## Commands

```bash
npm install
npm run dev
```

For a local production check:

```bash
npm run build
npm run start
```
