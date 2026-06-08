import React from 'react'
import { CandyCane, Package, ShoppingBag, Heart, Store, Star, Sparkles, Gift, Coffee, Cookie, IceCream, Cake } from 'lucide-react'

export const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CandyCane,
  Package,
  ShoppingBag,
  Heart,
  Store,
  Star,
  Sparkles,
  Gift,
  Coffee,
  Cookie,
  IceCream,
  Cake,
}

export function getCategoryIcon(iconName: string): React.ComponentType<{ className?: string }> {
  return CATEGORY_ICONS[iconName] || Package
}
