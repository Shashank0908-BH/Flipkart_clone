# Flipkart Clone

Flipkart-style ecommerce clone built with a Next.js storefront and FastAPI microservices for catalog, inventory, cart, auth, and orders.

## What is implemented

- Flipkart-style home page, product listing, PDP, cart, checkout, order history, and order confirmation
- Default shopper session so the core flow works without manual login
- OTP login as a bonus flow
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

## Railway deployment

Deploy each folder as its own Railway service. Every app service now includes a `railway.json` with the start command, restart policy, and `/health` path that Railway should use.

### 1. Create the Railway project

Create one Railway project and add the infrastructure services first:

- PostgreSQL
- Redis
- Elasticsearch via the Railway Elasticsearch template

Then add six code services from this repo:

| Service | Root directory | Config file |
| --- | --- | --- |
| Frontend | `frontend` | `frontend/railway.json` |
| Product catalog | `product-catalog` | `product-catalog/railway.json` |
| Inventory | `inventory-service` | `inventory-service/railway.json` |
| Cart | `cart-service` | `cart-service/railway.json` |
| Auth | `auth-service` | `auth-service/railway.json` |
| Orders | `order-service` | `order-service/railway.json` |

If Railway is pointed at the repo root, set each service's Root Directory to the folder above. If you keep the repo root as the source, set the Config as Code path to the matching `railway.json`.

### 2. Generate public domains

Generate a Railway public domain for all six app services. The frontend calls the backend APIs from the browser, so the API services also need public HTTPS domains for this version of the app.

### 3. Add environment variables

The examples below assume your Railway service names match the repo folder names exactly. If you rename a service in Railway, update the reference variable to match.

Shared / manual variables:

- `JWT_SECRET_KEY` -> set a strong random string on `auth-service`

`frontend`

- `NEXT_PUBLIC_CATALOG_URL=https://${{product-catalog.RAILWAY_PUBLIC_DOMAIN}}`
- `NEXT_PUBLIC_INVENTORY_URL=https://${{inventory-service.RAILWAY_PUBLIC_DOMAIN}}`
- `NEXT_PUBLIC_CART_URL=https://${{cart-service.RAILWAY_PUBLIC_DOMAIN}}`
- `NEXT_PUBLIC_AUTH_URL=https://${{auth-service.RAILWAY_PUBLIC_DOMAIN}}`
- `NEXT_PUBLIC_ORDERS_URL=https://${{order-service.RAILWAY_PUBLIC_DOMAIN}}`

`product-catalog`

- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `ELASTICSEARCH_URL=http://${{Elasticsearch.RAILWAY_PRIVATE_DOMAIN}}:9200`

`inventory-service`

- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `ELASTICSEARCH_URL=http://${{Elasticsearch.RAILWAY_PRIVATE_DOMAIN}}:9200`

`cart-service`

- `REDIS_URL=${{Redis.REDIS_URL}}`
- `PRODUCT_CATALOG_URL=https://${{product-catalog.RAILWAY_PUBLIC_DOMAIN}}`
- `INVENTORY_SERVICE_URL=https://${{inventory-service.RAILWAY_PUBLIC_DOMAIN}}`

`auth-service`

- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `JWT_SECRET_KEY=<same strong secret you set above>`

`order-service`

- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `CART_SERVICE_URL=https://${{cart-service.RAILWAY_PUBLIC_DOMAIN}}`
- `AUTH_SERVICE_URL=https://${{auth-service.RAILWAY_PUBLIC_DOMAIN}}`
- `INVENTORY_SERVICE_URL=https://${{inventory-service.RAILWAY_PUBLIC_DOMAIN}}`

### 4. Deploy order

Use this order so dependency URLs are ready when the next service comes up:

1. Elasticsearch, Postgres, Redis
2. `product-catalog`
3. `inventory-service`
4. `cart-service`
5. `auth-service`
6. `order-service`
7. `frontend`

### 5. Seed after deploy

Run the catalog seed first and the inventory sync second in Railway shell or as one-off jobs:

```bash
cd /app
python seed_es.py
```

Run that inside the `product-catalog` service shell, then:

```bash
cd /app
python sync_inventory.py
```

Run that inside the `inventory-service` service shell.

### 6. Recommended UptimeRobot monitors

Railway healthchecks are only used during deploy cutover, so use UptimeRobot for ongoing monitoring.

Create Website monitors for:

- `https://<frontend-domain>/health`
- `https://<product-catalog-domain>/health`
- `https://<inventory-domain>/health`
- `https://<cart-domain>/health`
- `https://<auth-domain>/health`
- `https://<orders-domain>/health`

Recommended settings:

- Monitor type: `Website`
- Check interval: `5 minutes` on the free plan, `1 minute` if you upgrade
- Timeout: default is fine
- Alert contacts: your email first, then Slack/Discord if you want team alerts

Optional UptimeRobot extras:

- Add a public status page with the frontend plus core API monitors
- Add a keyword monitor for the frontend home page if you want to verify a visible string like `Flipkart`
- Add a cron / heartbeat monitor later only if you automate catalog re-seeding or background jobs

### 7. First smoke test after deploy

After Railway finishes:

1. Open the frontend domain
2. Search products
3. Open a PDP and verify the image carousel loads
4. Add to cart
5. Complete checkout
6. Verify `/orders` and `/order-confirmation/<id>`

## Assumptions

- The app silently bootstraps a default shopper session so the assignment works without forcing login
- OTP remains visible in the auth response for development/demo usage
- Payment is simulated and stored as a successful transaction
- Product carousel fallback slides are generated as SVG data URIs, not random placeholder images
