# Flipkart Clone

Flipkart-style ecommerce clone built with a Next.js storefront and FastAPI microservices for catalog, inventory, cart, auth, and orders.

## What is implemented

- Flipkart-style home page, product listing, PDP, cart, checkout, order history, and order confirmation
- Default shopper session so the core flow works without manual login
- OTP login as a bonus flow
- Wishlist page backed by the auth service
- Order confirmation email delivery when email provider env vars are configured
- Elasticsearch-backed product catalog with rupee-normalized pricing
- Multi-image carousel data for every product, including generated merchandising slides
- Inventory validation during cart updates and checkout
- Railway-friendly environment configuration using `DATABASE_URL`, `REDIS_URL`, and service URL env vars

## Services

| Service | Path | Default local port |
| --- | --- | --- |
| Frontend | `frontend` | `3000` |
| Product catalog | `product-catalog` | `8000` |
| Inventory | `inventory-service` | `8001` |
| Cart | `cart-service` | `8002` |
| Auth | `auth-service` | `8003` |
| Orders | `order-service` | `8004` |

## Local setup

### Infrastructure

```bash
docker-compose up -d
```

This starts PostgreSQL on `5433`, Redis on `6379`, and Elasticsearch on `9200`.

### Python services

Run each service in its own terminal:

```bash
cd product-catalog
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

```bash
cd inventory-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

```bash
cd cart-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8002
```

```bash
cd auth-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8003
```

```bash
cd order-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8004
```

### Seed catalog and inventory

```bash
cd product-catalog
source venv/bin/activate
python seed_es.py
```

```bash
cd inventory-service
source venv/bin/activate
python sync_inventory.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## One-day evaluation deployment

For the assignment evaluation window, the lowest-friction setup is:

- `frontend` on Vercel Hobby
- backend + infra on Railway Trial
- no refactor of the existing microservice split

This repo is set up for a one-day evaluator run, not a long-lived always-on free-tier deployment.

### Why this split

- Vercel handles the Next.js storefront with the least setup friction
- Railway Trial can host the Python services and data stores for the evaluation day
- keeping the current service boundaries avoids risky last-minute rewrites

### Railway project layout

Railway Trial is easiest to manage here as two separate projects.

`core-stack`

| Service | Root directory | Config file |
| --- | --- | --- |
| Postgres | Railway template | n/a |
| Elasticsearch | Railway template | n/a |
| Product catalog | `product-catalog` | `product-catalog/railway.json` |
| Inventory | `inventory-service` | `inventory-service/railway.json` |
| Auth | `auth-service` | `auth-service/railway.json` |

`checkout-stack`

| Service | Root directory | Config file |
| --- | --- | --- |
| Redis | Railway template | n/a |
| Cart | `cart-service` | `cart-service/railway.json` |
| Orders | `order-service` | `order-service/railway.json` |

Deploy the storefront separately from `frontend` on Vercel. Do not deploy the frontend to Railway for this evaluator setup.

If Railway is pointed at the repo root, set each service's Root Directory to the folder above and keep the matching `railway.json` inside that folder.

### Public domains

Generate Railway public domains for:

- `product-catalog`
- `inventory-service`
- `auth-service`
- `cart-service`
- `order-service`

The frontend calls these APIs directly from the browser, so they must be reachable over HTTPS.

### Environment variables

The examples below assume your Railway service names match the repo folder names exactly. If you rename a service in Railway, update the references accordingly.

#### Vercel (`frontend`)

- `NEXT_PUBLIC_CATALOG_URL=https://<product-catalog-domain>`
- `NEXT_PUBLIC_INVENTORY_URL=https://<inventory-domain>`
- `NEXT_PUBLIC_CART_URL=https://<cart-domain>`
- `NEXT_PUBLIC_AUTH_URL=https://<auth-domain>`
- `NEXT_PUBLIC_ORDERS_URL=https://<orders-domain>`

#### Railway `core-stack`

`product-catalog`

- `ELASTICSEARCH_URL=http://${{Elasticsearch.RAILWAY_PRIVATE_DOMAIN}}:9200`

`inventory-service`

- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `ELASTICSEARCH_URL=http://${{Elasticsearch.RAILWAY_PRIVATE_DOMAIN}}:9200`

`auth-service`

- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `JWT_SECRET_KEY=<strong random secret>`

#### Railway `checkout-stack`

`cart-service`

- `REDIS_URL=${{Redis.REDIS_URL}}`
- `PRODUCT_CATALOG_URL=https://<product-catalog-domain>`
- `INVENTORY_SERVICE_URL=https://<inventory-domain>`

`order-service`

- `DATABASE_URL=<public or external Postgres connection string from core-stack>`
- `CART_SERVICE_URL=https://<cart-domain>`
- `AUTH_SERVICE_URL=https://<auth-domain>`
- `INVENTORY_SERVICE_URL=https://<inventory-domain>`
- `ORDER_EMAIL_FROM=<verified sender address>`
- `ORDER_NOTIFICATION_TO_EMAIL=<fallback inbox for default-session orders, optional>`
- `EMAIL_PROVIDER=auto|resend|smtp`
- `RESEND_API_KEY=<required when using Resend>`
- `SMTP_HOST=<required when using SMTP>`
- `SMTP_PORT=587`
- `SMTP_USERNAME=<optional>`
- `SMTP_PASSWORD=<optional>`
- `SMTP_USE_TLS=true`

If the shopper is using the default assignment session, order emails go to `ORDER_NOTIFICATION_TO_EMAIL` when it is configured. OTP-logged-in shoppers receive emails at their own email address.

### Deploy order

Use this order so dependencies are ready before downstream services boot:

1. `core-stack` infra: Postgres, Elasticsearch
2. `core-stack` apps: `product-catalog`, `inventory-service`, `auth-service`
3. Seed data in Railway:
   - `product-catalog`: `python seed_es.py`
   - `inventory-service`: `python sync_inventory.py`
4. `checkout-stack` infra: Redis
5. `checkout-stack` apps: `cart-service`, `order-service`
6. `frontend` on Vercel with the final public API URLs

### Smoke test after deploy

The repo includes a smoke test script that exercises the deployed evaluator flow end to end.

Required env vars:

```bash
CATALOG_URL=https://<product-catalog-domain>
INVENTORY_URL=https://<inventory-domain>
CART_URL=https://<cart-domain>
AUTH_URL=https://<auth-domain>
ORDERS_URL=https://<orders-domain>
FRONTEND_URL=https://<vercel-frontend-domain>
```

Run it from the repo root:

```bash
node scripts/smoke-test.mjs
```

Optional OTP verification:

```bash
RUN_OTP_CHECK=1 node scripts/smoke-test.mjs
```

The smoke test validates:

- service health endpoints
- frontend availability
- default guest session bootstrap
- catalog search and product detail fetch
- inventory lookup
- add-to-cart and quantity update
- checkout and order retrieval
- optional OTP send/verify flow

### Operational notes

- Deploy as close to the evaluation day as possible so Railway Trial credit is spent on the actual demo window
- UptimeRobot is optional for outage visibility only; do not use it as a keep-alive strategy
- Keep the deployed state unchanged once the final smoke test passes

## Assumptions

- The app silently bootstraps a default shopper session so the assignment works without forcing login
- OTP remains visible in the auth response for development/demo usage
- Payment is simulated and stored as a successful transaction
- Product carousel fallback slides are generated as SVG data URIs, not random placeholder images
