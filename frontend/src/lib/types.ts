export interface SessionUser {
  id: number;
  phone?: string | null;
  email?: string | null;
  name?: string | null;
  cart_user_id: string;
}

export interface AuthSessionResponse {
  access_token: string;
  token_type: string;
  user: SessionUser;
}

export interface ProductMetadata {
  weight?: number;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  barcode?: string;
  material?: string;
  capacity?: string;
  seller?: string;
}

export interface Product {
  id: string;
  title: string;
  short_description?: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  slashed_price: number;
  discount_percentage: number;
  images: string[];
  thumbnail?: string;
  tags?: string[];
  badges?: string[];
  customer_rating?: number;
  review_count?: number;
  brand?: string;
  sku?: string;
  stock?: number;
  availability_status?: string;
  return_policy?: string;
  shipping_info?: string;
  warranty_info?: string;
  metadata?: ProductMetadata;
}

export interface InventoryStatus {
  id: string;
  available_stock: number;
  total_stock: number;
  status: string;
  last_updated?: string;
}

export interface CartItem {
  product_id: string;
  quantity: number;
  title: string;
  price: number;
  slashed_price?: number;
  thumbnail: string;
  discount_percentage?: number;
  brand?: string;
  line_total: number;
}

export interface CartResponse {
  user_id: string;
  items: CartItem[];
  item_count: number;
  subtotal: number;
  total: number;
}

export interface CheckoutAddress {
  full_name: string;
  phone: string;
  pincode: string;
  locality: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  landmark?: string;
  address_type: "HOME" | "WORK";
}

export interface OrderLineItem {
  product_id?: string;
  title: string;
  quantity: number;
  price: number;
  thumbnail?: string;
}

export interface OrderSummary {
  id: string;
  status: string;
  total_amount: number;
  created_at?: string;
  shipping_address?: CheckoutAddress;
  items: OrderLineItem[];
}

export interface Category {
  slug: string;
  name: string;
  description: string;
  group: string;
}
