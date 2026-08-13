export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  base_price: number;
  image_url: string;
  tags: string[];
  stars: number;
  reviews: number;
  diet?: ('Sin Azúcar' | 'Vegan' | 'Orgánico')[];
  bestseller?: boolean;
  on_sale?: boolean;
  discount_percentage?: number;
  sizes?: { [key: string]: number };
  unit_type?: 'weight' | 'piece';
  price_per_kg?: number;
  stock: number;
  min_weight?: number;
  max_weight?: number;
  weight_step?: number;
  images?: string[];
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  itemPrice: number;
  weight_grams?: number;
}

export type ActiveScreen = 'inicio' | 'catalogo' | 'carrito' | 'login' | 'registro' | 'detalle' | 'admin' | 'nosotros' | 'como-comprar' | 'mis-pedidos';

export type AdminSection = 'dashboard' | 'analytics' | 'products' | 'orders' | 'users' | 'promos' | 'homepage' | 'about-page' | 'categories' | 'whatsapp' | 'shipping';

export interface CustomWhatsAppMessage {
  id: string;
  title: string;
  content: string;
}

export interface StoreSettings {
  whatsapp_number_1: string;
  whatsapp_number_2: string;
  active_whatsapp_number: 'num1' | 'num2';
  active_phone: string;
  msg_transfer?: string;
  msg_mercadopago?: string;
  msg_general_inquiry?: string;
  msg_order_status?: string;
  msg_preparing?: string;
  msg_ready?: string;
  custom_whatsapp_messages?: CustomWhatsAppMessage[];
  fulfillment_type: 'both' | 'pickup_only' | 'delivery_only';
  delivery_cost: number;
  free_delivery_over: number;
  pickup_address: string;
  pickup_schedule: string;
  delivery_notes: string;
}

export interface HomepageSection {
  id: string;
  section_type: string;
  title: string;
  subtitle: string | null;
  content: Record<string, any>;
  order_index: number;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  email: string | null;
  name: string | null;
  isLoggedIn: boolean;
  role?: string;
}
