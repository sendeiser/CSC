CREATE TABLE homepage_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type TEXT NOT NULL,
  title TEXT DEFAULT '',
  subtitle TEXT DEFAULT '',
  content JSONB DEFAULT '{}'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins manage homepage sections"
  ON homepage_sections
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Everyone can read visible sections
CREATE POLICY "Anyone read visible sections"
  ON homepage_sections
  FOR SELECT
  TO anon, authenticated
  USING (visible = true);

-- Seed default sections
INSERT INTO homepage_sections (section_type, title, subtitle, content, order_index) VALUES
  ('hero', 'Bienvenido a Chamical Candy Shop', 'Gomitas, chocolates y mucho más — todo por granel', '{"cta": "Ver Catálogo", "cta2": "Consultar por WhatsApp", "hero_product_slug": ""}', 1),
  ('about', 'Sobre Nosotros', 'El dulce sabor de Chamical', '{"paragraphs": ["En Chamical Candy Shop nos apasiona endulzar tu día. Desde nuestra tienda en el corazón de Chamical, ofrecemos una gran variedad de golosinas, gomitas, chocolates y caramelos — todos disponibles por granel.", "Trabajamos con proveedores de confianza para garantizar la mejor calidad y frescura. En CSC encontrás todo lo que buscas."], "tags": ["Atención personalizada", "Venta por mayor y menor", "Productos frescos"], "image_url": "https://lh3.googleusercontent.com/aida-public/AB6AXuCFnupY6X3OeWe0OGFu9RFhJShIgtvC_FkNPvWvsDQsEqMffRmytrJKsrR8MospRiGaPeWN7K3hfxXv6HatHiFZ0_wG2H_Xf7sWsZvFo_2ilbtQ5wuV1ETbk3t-y_1unWmzIIGkjZo8hiKVjZ28cx-jgKjYPdRIeqCp-229-FlxD82IPCvBVRhxQcqT5TQKiTdIpwcr6jZx9zh1EkT0m44G30LttcE1FzFxB475xHOk3HD4HIoRUXfpBW4kdmSfOMW9hal3MbRXNfQ"}', 2),
  ('categories', 'Nuestros Productos', '¿Qué antojo tenés hoy?', '{"subtitle": "Elegí entre nuestras categorías"}', 3),
  ('store', 'Nuestra Tienda', 'Visitanos', '{"address": "Av. Principal 123, Chamical, La Rioja", "phone": "+54 9 3854 00-0000", "whatsapp": "5493854000000", "email": "info@chamicalcandy.shop", "instagram": "@chamicalcandy", "hours": [{"day": "Lun - Vie", "time": "09:00 - 13:00 / 17:00 - 21:00"}, {"day": "Sáb", "time": "09:00 - 14:00 / 17:00 - 20:00"}, {"day": "Dom", "time": "Cerrado"}]}', 4),
  ('gallery', 'Galería', 'Nuestros Dulces', '{"subtitle": "Algunos de nuestros productos destacados", "limit": 6}', 5),
  ('contact', '¿Tenés antojo?', '', '{"whatsapp_number": "5493854000000", "show_whatsapp": true, "show_catalog": true}', 6);
