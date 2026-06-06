export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: 'Gomitas' | 'Chocolates' | 'Acidulados' | 'Caramelos' | 'Regalos';
  base_price: number;
  image_url: string;
  tags: string[];
  stars: number;
  reviews: number;
  diet?: ('Sin Azúcar' | 'Vegan' | 'Orgánico')[];
  bestseller?: boolean;
  on_sale?: boolean;
  discount_percentage?: number;
  sizes?: {
    [key: string]: number;
  };
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  itemPrice: number;
}

export type ActiveScreen = 'inicio' | 'catalogo' | 'carrito' | 'login' | 'registro' | 'detalle' | 'admin';

export type AdminSection = 'dashboard' | 'products' | 'orders' | 'users' | 'promos';

export interface UserSession {
  email: string | null;
  name: string | null;
  isLoggedIn: boolean;
  role?: string;
}
