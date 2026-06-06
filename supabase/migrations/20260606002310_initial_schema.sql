-- =============================================
-- Candyverse - Initial Schema
-- =============================================

-- 1. PRODUCTS
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Gomitas', 'Chocolates', 'Acidulados', 'Caramelos', 'Regalos')),
  base_price DECIMAL(10,2) NOT NULL,
  image_url TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  stars INTEGER DEFAULT 5 CHECK (stars >= 1 AND stars <= 5),
  reviews INTEGER DEFAULT 0,
  diet TEXT[] DEFAULT '{}',
  bestseller BOOLEAN DEFAULT false,
  on_sale BOOLEAN DEFAULT false,
  discount_percentage INTEGER DEFAULT 0,
  sizes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PROFILES (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. FAVORITES
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 4. PROMO CODES
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  percent INTEGER NOT NULL CHECK (percent > 0 AND percent <= 100),
  active BOOLEAN DEFAULT true,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. PRODUCT REVIEWS
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, user_id)
);

-- 6. CART ITEMS
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  selected_size TEXT NOT NULL,
  item_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id, selected_size)
);

-- 7. ORDERS
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  total DECIMAL(10,2) NOT NULL,
  promo_code_id UUID REFERENCES promo_codes(id),
  discount_amount DECIMAL(10,2) DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  shipping_name TEXT,
  shipping_address TEXT,
  shipping_city TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. ORDER ITEMS
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  selected_size TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL
);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- PRODUCTS
CREATE POLICY "products_select_anon" ON products FOR SELECT TO anon USING (true);
CREATE POLICY "products_select_auth" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_insert_admin" ON products FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "products_update_admin" ON products FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "products_delete_admin" ON products FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- PROFILES
CREATE POLICY "profiles_select_anon" ON profiles FOR SELECT TO anon USING (true);
CREATE POLICY "profiles_select_auth" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_self" ON profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_self" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- FAVORITES
CREATE POLICY "favorites_select_self" ON favorites FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "favorites_insert_self" ON favorites FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "favorites_delete_self" ON favorites FOR DELETE TO authenticated USING (user_id = auth.uid());

-- PROMO CODES
CREATE POLICY "promo_codes_select_anon" ON promo_codes FOR SELECT TO anon USING (active = true);
CREATE POLICY "promo_codes_select_auth" ON promo_codes FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "promo_codes_insert_admin" ON promo_codes FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "promo_codes_update_admin" ON promo_codes FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "promo_codes_delete_admin" ON promo_codes FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- PRODUCT REVIEWS
CREATE POLICY "reviews_select_anon" ON product_reviews FOR SELECT TO anon USING (true);
CREATE POLICY "reviews_select_auth" ON product_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "reviews_insert_auth" ON product_reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "reviews_update_self" ON product_reviews FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "reviews_delete_self" ON product_reviews FOR DELETE TO authenticated USING (user_id = auth.uid());

-- CART ITEMS
CREATE POLICY "cart_select_self" ON cart_items FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "cart_insert_self" ON cart_items FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "cart_update_self" ON cart_items FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "cart_delete_self" ON cart_items FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ORDERS
CREATE POLICY "orders_select_self" ON orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "orders_insert_self" ON orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "orders_update_admin" ON orders FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "orders_delete_admin" ON orders FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ORDER ITEMS (inherits from orders)
CREATE POLICY "order_items_select_self" ON order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid()));
CREATE POLICY "order_items_insert_self" ON order_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid()));
CREATE POLICY "order_items_insert_admin" ON order_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "order_items_select_admin" ON order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- =============================================
-- FUNCTIONS
-- =============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Increment promo code usage
CREATE OR REPLACE FUNCTION public.use_promo_code(p_code TEXT)
RETURNS TABLE(valid BOOLEAN, percent INTEGER, message TEXT) AS $$
DECLARE
  v_promo promo_codes%ROWTYPE;
BEGIN
  SELECT * INTO v_promo FROM promo_codes WHERE code = p_code AND active = true;
  
  IF v_promo.id IS NULL THEN
    RETURN QUERY SELECT false, 0, 'Código inválido o expirado.'::TEXT;
    RETURN;
  END IF;
  
  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < now() THEN
    RETURN QUERY SELECT false, 0, 'Este cupón ha expirado.'::TEXT;
    RETURN;
  END IF;
  
  IF v_promo.max_uses IS NOT NULL AND v_promo.used_count >= v_promo.max_uses THEN
    RETURN QUERY SELECT false, 0, 'Este cupón ya no está disponible.'::TEXT;
    RETURN;
  END IF;
  
  UPDATE promo_codes SET used_count = used_count + 1 WHERE id = v_promo.id;
  
  RETURN QUERY SELECT true, v_promo.percent, 'Cupón aplicado correctamente.'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SEED DATA: Products from data.ts
-- =============================================

INSERT INTO products (slug, name, description, category, base_price, image_url, tags, stars, reviews, diet, bestseller, on_sale, discount_percentage, sizes) VALUES
(
  'gomitas-explosion-galactica',
  'Gomitas de Explosión Galáctica',
  'Viaja a través de una nebulosa de sabor con nuestras exclusivas gomitas infusionadas con néctar de frutas exóticas. Cada bocado ofrece una textura suave y sedosa que se derrite lentamente, liberando ráfagas de frambuesa azul, pitaya y un toque secreto de lluvia de estrellas ácida.',
  'Gomitas',
  12.50,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCpiDU1FUsKrUy77WDq6JPCy2kU9uvvnAJaJB_HyQW6SFHSnAiGg4-XadyKR84IP_DOgm4j03h32ZL8T-w3KdxVPPebxMSWvLYbApoy12uPtJO_oCxG9fyXZK_g4qdU0cksgx1E2pWA1RT1RAyvc52ad6l9g0ytPcprx-NV262CI5FU-iUEm4iZ83BDlvcIylfZ57Nb__5-AsVdqhSDmtsgwfDM1znhM1PxdZfzhyPpmfV0qbU9wFxkfRcPZ6LrZMNVznHA15cuX8E',
  ARRAY['NUEVO', 'EXPLOSIÓN'],
  5,
  124,
  ARRAY['Vegan', 'Orgánico'],
  false,
  false,
  NULL,
  '{"250g": 12.50, "500g": 22.00, "1kg": 40.00}'::JSONB
),
(
  'ositos-cosmicos',
  'Ositos Cósmicos',
  'Ositos de goma con una infusión estelar y brillo de cristales dulces. Sabor frutal cósmico.',
  'Gomitas',
  36.00,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAnTn-8eN_rgTy-4OoAKqTOyvmfJe77NZsy_yb5Rw1nconCv-rVZbv-sdRLjJkpIPEplZUYOA6LGKSVyzhMBztoYcSD1Sxsq2gZYRsZHto5J9oSWf-3lrop4Dh6X5ijmDL40Hl4erLX62j92n2qaOoPrktp6E2Mgf7EkTCBVj_zuE10WKqPYkqzUSMz2LA04nVGz04htPOJc8lE4Avun7SHMafBQiiw3eyjQ3Ovh2J45F4l0m6rMmUDSexmQ1_6rriHL9vATX-SYkQ',
  ARRAY['VEGANO', 'FRUTAL'],
  5,
  98,
  ARRAY['Vegan', 'Sin Azúcar'],
  false,
  true,
  20,
  '{"300g": 36.00, "500g": 55.00}'::JSONB
),
(
  'cintas-neon',
  'Cintas Neón',
  'Tiras ácidas y crujientes que brillan con sabor electrizante a frambuesa y manzana.',
  'Acidulados',
  25.00,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBKcX9ouLcbBZed9-5IMR9dZRT8qVFnD_9hxpyZ_pA213DQ8Bmnyxj7b0Zjjq0JnZwzee2Ym7kok6AhuuvoC-cVDO_-1KtDNzvY-YE6jQqu89oT_GffZ5Jm1GZRXqOib6aR0oeVgD_MM0uhle88ragzvYi0U6oxPMfxC-bC9gUkeMj8BRXXUz3rw3BhSArN7Amaualolqjz4rtqh14usosAeBWR-qomc0TXEZgPTYiNtWl0r1wFrErPenSxEJ5hhmwHEwbLgT7PETE',
  ARRAY['EXTRA SOUR', 'NEW'],
  4,
  73,
  ARRAY['Vegan'],
  false,
  false,
  NULL,
  '{"Pack Estándar": 25.00, "Pack Familiar": 42.00}'::JSONB
),
(
  'trufas-galacticas',
  'Trufas Galácticas',
  'Chocolate amargo premium al 70% con un suntuoso y celestial relleno de caramelo salado.',
  'Chocolates',
  89.00,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC6PG13q1F54FjFcTqlALl73SWWjXh9dkTtBhWkdbaHptLs529Fxi1giKbBCIPUEL-iUV-nC1YC_Ps2G-rxI-0WKJC0XXBWR0WZXD31xtnDZbvKTEGaIpeM871GYMmL37-9tTzfmpQ8bLWc_OsXCUiVJAZWadhdOzPIbgISCO53AQcZmvnQPKbMlh6FRjmNG84G0LGWw8kqOomb5ZoH7G5FVdEw7Q-DGDFrL2ol9ggf8o3Mm_4GRlJc2OrVUxzu8mGpSWOee5PtpUA',
  ARRAY['BESTSELLER', 'RIQUÍSIMO'],
  5,
  212,
  ARRAY['Orgánico'],
  true,
  false,
  NULL,
  '{"Caja 12 pzs": 89.00, "Caja 24 pzs": 160.00}'::JSONB
),
(
  'caja-universo-sabor',
  'Caja Universo de Sabor',
  'Un viaje astronómico por todos nuestros mejores dulces en una sola caja de regalo de lujo.',
  'Regalos',
  350.00,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB4yiMyugW0FxSq358OnNzc2tvnzt_kgOhTICeRmGDBDOh3Ke___QNjJMggzh_LP75u3ltsWOWGTP-x9-XXcj7CMCYPh1A54SKMOLeo9K6eX2lf6uZAiyXh6e5f4HJkj408JezSrNqYekV4OT4laSReqD5Wy-mWuR6V49a5Py_1N7K5tg4KyQjltnbyUFprQnB4u6EbKQUXE_3JOpkM1m5MvHjoZZ6CSdGIqyppsPgEa122mKjNHTXS2zgdRYSf5JCAgBbjWN294gU',
  ARRAY['EDICIÓN LIMITADA', 'REGALO'],
  5,
  46,
  ARRAY['Orgánico'],
  false,
  false,
  NULL,
  '{"Set Premium": 350.00}'::JSONB
),
(
  'nubes-algodon',
  'Nubes de Algodón',
  'Bombones artesanales ultra esponjosos con una sutil infusión de vainilla de Madagascar natural.',
  'Caramelos',
  55.00,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD40m9zbl6ELzkkdCNfNeOQ1pZR2u75kMN7FNNp6a_Q2Ou-W7TtEMw2DQ-iT-fhihLw4uRyAJEwp99jm1WjpevuKN7TUwqkgQgXdFqZhs1TJ0OFYx6JSMgwYRPnsnEe_GV5_kgnEJwzPiaTZtWCOIHtImVYoK1LgnJaNaUlaGJchgOzz5EehtdD42YFy4tlhqxViag1NZqLiYvAPU1KTDLzmCXMMHuoh_5LvaW1AniJL_MhNlvF4DFOnRBKwBtrWDqTCGYS16BUAU0',
  ARRAY['ORGÁNICO', 'DELICADO'],
  4,
  81,
  ARRAY['Orgánico'],
  false,
  false,
  NULL,
  '{"Caja Clásica": 55.00, "Caja XL": 98.00}'::JSONB
),
(
  'coleccion-nubes-oro',
  'Colección "Nubes de Oro"',
  'Chocolates de autor rellenos y decorados con destellos de láminas de oro puro comestible.',
  'Chocolates',
  120.00,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCmchaLyj3bR-x4SDWG_70kZMkZUY2wrNmxVeiEuxuObvmQB1HlqWH-WVip1rN4Pw8ZvkvmxBWHCeeOgKgIQWFLXXmaR-RX79xt4kxmC7idVhti1p2e_Z5fY1U31Pb4_WlgMZc7kPpmFmqT942nvFyBrllXpCGSL_N3NpIT3dE3UA-a2rNx8okqB_lEgIG_NbW51rs5nBeO1DyM60KHhUWJ0P9n1MRUr3AYFSEssnJZcBPu49o0jJQeFVdu9DGJZXbCOMpoYPXpkoY',
  ARRAY['EDICIÓN LIMITADA', 'GOURMET'],
  5,
  32,
  ARRAY['Orgánico'],
  false,
  false,
  NULL,
  '{"Caja 9 pzs": 120.00, "Caja 16 pzs": 195.00}'::JSONB
),
(
  'paletas-espiral',
  'Paletas Espiral',
  'Preciosos caramelos en espiral artesanales de tonos alegres y sabor nostálgico.',
  'Caramelos',
  3.50,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAhkxMF82LeaMwKBJ7rZZXe6zxHsqZUZmg76n2MkPA6Z2J23q0GVh0kwDq0R6FXfR57rrPIUj4jbhJCQzB44lGHuC6_Ugoj1TT321U8hyHhvkkdSkDsGh2kUOUrrFRE5vMLoqigi2nUAozMwQF5EWtYFTKu3rmtXSLkcBllB02YGBMIfmjFVbU95JjES4nWNAK5LvRlH-1Se_uHy96YYEDcSZuI5er2NIcA3fbgcKqq-6AUXrDvSnSut_d9WNBDFvGO3i7Klhs-gEY',
  ARRAY['ARTESANAL'],
  4,
  145,
  ARRAY['Vegan'],
  false,
  false,
  NULL,
  '{"1 pieza": 3.50, "Pack 3 piezas": 9.00}'::JSONB
),
(
  'neon-worms',
  'Neon Worms',
  'Luminosos gusanos de gominola cubiertos de azúcar ácido que estallará en tu boca.',
  'Acidulados',
  5.99,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA8sXldN92lkY1jHTe_PHBwDwsiG2QOllSf7JdaoGxybnVSYbXd_ntULS0HhFlWNJTbIhJojY10iYdLY6erneF3APq6GVQ7bx00GuiLCvwFJ2ctSmUCsWl-3n8i9-GeIjGIqJngz597bOP4u-ncMF-ybno3aR_Z-ZGk2gekjQGIbtcewMYTKX2wdbO3WKRpYNFS0NWY5f_0Sfgqo2ucLp8myRAQMlIU18k8n5swfccRay5203LRtUs_TJ5z_vlhFedl8SIctly0SD4',
  ARRAY['EXTRA SOUR', 'DIVERTIDO'],
  4,
  112,
  ARRAY['Vegan'],
  false,
  false,
  NULL,
  '{"Pack 200g": 5.99, "Pack 500g": 12.00}'::JSONB
),
(
  'pack-macarons',
  'Pack Macarons',
  'Surtido impecable de crujientes y deliciosos macarons franceses en tonos pastel.',
  'Regalos',
  18.00,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCpUF5kb0CbrBqFZP1QAhREbYw1RNtY3iMP65LtOiaGlrq5A_0qF8JXqkSOrltfO4_cfzX2GtJ_207-jryqFH61l79mXdD8PcB8oJPsssLUrfBaspS6UYd7EyTFsq5xn8G89sGalZyp_jp3sNmczAi7Ih_FcT0cLiz5pDiuR0HkcTOZcYsK8XdaOY25DiSFvDD410w_aLG_zYfbpdzmFtMN3QZo9SBY--L22x6mNhjj6gX9bxdlwM7L9Ud-5X2xmgln_2AajGNoGBY',
  ARRAY['GOURMET', 'FRUTADO'],
  5,
  79,
  ARRAY['Orgánico'],
  false,
  false,
  NULL,
  '{"Estuche 6 pzs": 18.00, "Estuche 12 pzs": 32.00}'::JSONB
),
(
  'fiesta-gummy',
  'Fiesta Gummy',
  'Un magnífico recopilatorio de nuestras gominolas frutales más coloridas y brillantes.',
  'Gomitas',
  12.50,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBW_R0yaBzAijbha2wbrpWE_kucWMQaJ8iOiSljgo0TG0QbWCwLgNNBX2Oe52xd8e1DXJuKgh1cvUjVCFssDEy79Laa5qDvOhI4TLGvICFlQ1qpbJfD3NcwKMT1QZmW5-uzQlLUrQ6GRNAHJXOf90NPHrXV8LegH2bZsXXcYPBkxJ2EH5ZETCZZu1kj_lF9H5LFn-s_IqgSuJosNh19y-hbIBxJsGsDvLlBZsh4_WytlZ37GaJQ_7jD79esjQtR3ETufWk8mRExvsk',
  ARRAY['COMPARTIR', 'FRUTAL'],
  4,
  94,
  ARRAY['Vegan'],
  false,
  false,
  NULL,
  '{"Bolsa 500g": 12.50, "Bolsa 1kg": 22.00}'::JSONB
),
(
  'cristales-frutales',
  'Cristales Frutales',
  'Caramelos duros semitransparentes como gemas galácticas con néctar de fruta.',
  'Caramelos',
  8.90,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBPy5Tx_8hOGucW2qrJhxNV6S2iDaJGd5GCKQ_-W7VxnDvhsCXOzB2mdAJrEtjztJXMrtaNfqeJSaWurIK4cu1vQM3-j8PjZclbxGJTtVddXhBQVl-cKlW2i3E8uiS67Ol412usR9jKwwuAOS_kpAS4ugcRnSVa91j463Wq0gqYKTEhWrQwLM-3vKGCnQfiupgtSsCRQDndgNeH3lKaE4rDJ2LasXQaGfnSDH52xv9vVfOaqB3pzS1rXXdz2fMOqhv3Loa9fReJvGU',
  ARRAY['DELICADO', 'INTENSO'],
  4,
  65,
  ARRAY['Orgánico', 'Sin Azúcar'],
  false,
  false,
  NULL,
  '{"Bolsita 150g": 8.90, "Bolsita 300g": 16.00}'::JSONB
),
(
  'box-trufas',
  'Box Trufas',
  'Exclusiva selección de bombones y trufas artesanas de cacao premium seleccionados de cooperativas.',
  'Chocolates',
  24.00,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDgyFGma4r5tf4ZWf_K1LBzT9rFlnnlNq6VwoexWlnMUDm3TqIpgQ0VGpY0IxwTAFwJ92ba5jICoVHj02WLmXlKYTJC12mKTx28fOVhvYwvAZi-wJcQ79PEg_1cX9co-stdT1Okc8U3CbrREi8mmPWrZBkfqzdnM1WBCG4Qpu79BW57ESwinctKjlWDMdEu4-in-_PgvHF6QKpB-rkSl4rWIBgnN-kCOLELe_iMRUaZrTKix38scGT7mcyq-Kkizhy6TebvpjU__CM',
  ARRAY['EDICIÓN LIMITADA', 'CACAO'],
  5,
  139,
  ARRAY['Orgánico'],
  false,
  false,
  NULL,
  '{"Caja 12 pzs": 24.00, "Caja 24 pzs": 45.00}'::JSONB
);

-- Seed promo codes
INSERT INTO promo_codes (code, percent, max_uses) VALUES
  ('DULCE2024', 15, 100);

-- =============================================
-- REMOTE SCHEMA EXTENSION FOR AUTH
-- This must run after auth.users exists
-- =============================================

-- Grant API access to authenticated role for tables
GRANT ALL ON products TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON favorites TO authenticated;
GRANT ALL ON promo_codes TO authenticated;
GRANT ALL ON product_reviews TO authenticated;
GRANT ALL ON cart_items TO authenticated;
GRANT ALL ON orders TO authenticated;
GRANT ALL ON order_items TO authenticated;

-- Grant SELECT to anon
GRANT SELECT ON products TO anon;
GRANT SELECT ON profiles TO anon;
GRANT SELECT ON promo_codes TO anon;
GRANT SELECT ON product_reviews TO anon;
