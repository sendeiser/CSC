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
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  itemPrice: number;
  weight_grams?: number;
}

export type ActiveScreen = 'inicio' | 'catalogo' | 'carrito' | 'login' | 'registro' | 'detalle' | 'admin' | 'nosotros';

export type AdminSection = 'dashboard' | 'analytics' | 'products' | 'orders' | 'users' | 'promos' | 'homepage' | 'about-page' | 'categories';

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
