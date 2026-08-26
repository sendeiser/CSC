import { CustomQuickMessage } from './lib/whatsapp';

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
  is_combo?: boolean;
  combo_capacity?: number;
  combo_allowed_types?: 'weight' | 'piece' | 'both';
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  itemPrice: number;
  weight_grams?: number;
  comboSelections?: {
    productId: string;
    name: string;
    quantity: number;
    isWeight: boolean;
    capacityGrams: number;
  }[];
}

export type ActiveScreen = 'inicio' | 'catalogo' | 'carrito' | 'login' | 'registro' | 'detalle' | 'admin' | 'nosotros' | 'como-comprar' | 'mis-pedidos';

export type AdminSection = 'dashboard' | 'analytics' | 'finances' | 'products' | 'orders' | 'users' | 'promos' | 'homepage' | 'banners' | 'about-page' | 'categories' | 'whatsapp' | 'chatbot-lab' | 'shipping' | 'notifications';

export interface ExpenseItem {
  id: string;
  type: 'expense' | 'income';
  category: string;
  description: string;
  amount: number;
  payment_method: 'Efectivo' | 'Transferencia' | string;
  date: string;
  notes?: string;
  created_at?: string;
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
  custom_messages?: CustomQuickMessage[];
  fulfillment_type: 'both' | 'pickup_only' | 'delivery_only';
  delivery_cost: number;
  free_delivery_over: number;
  pickup_address: string;
  pickup_schedule: string;
  delivery_notes: string;

  // Datos bancarios para transferencia
  bank_alias?: string;
  bank_name?: string;
  bank_holder?: string;
  bank_cbu?: string;

  // Mobile & Server Notifications
  store_website_url?: string;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  telegram_enabled?: boolean;
  whatsapp_callmebot_phone?: string;
  whatsapp_callmebot_apikey?: string;
  whatsapp_notifications_enabled?: boolean;
  discord_webhook_url?: string;
  discord_enabled?: boolean;
  notify_on_new_order?: boolean;
  notify_on_new_user?: boolean;
  browser_sound_alerts_enabled?: boolean;
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
