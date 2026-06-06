import { CartItem } from '../types';

const LOCAL_CART_KEY = 'csc_cart_local'

export function getLocalCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveLocalCart(cart: CartItem[]) {
  localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cart))
}

export function clearLocalCart() {
  localStorage.removeItem(LOCAL_CART_KEY)
}
