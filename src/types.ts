export interface Product {
  id: string;
  name: string;
  description: string;
  category: 'Gomitas' | 'Chocolates' | 'Acidulados' | 'Caramelos' | 'Regalos';
  price: number;
  image: string;
  tags: string[];
  stars: number;
  reviews: number;
  diet?: ('Sin Azúcar' | 'Vegan' | 'Orgánico')[];
  bestseller?: boolean;
  onSale?: boolean;
  discountPercentage?: number;
  sizes?: {
    [key: string]: number;
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  itemPrice: number;
}

export type ActiveScreen = 'inicio' | 'catalogo' | 'carrito' | 'login' | 'registro' | 'detalle';

export interface UserSession {
  email: string | null;
  name: string | null;
  isLoggedIn: boolean;
}
