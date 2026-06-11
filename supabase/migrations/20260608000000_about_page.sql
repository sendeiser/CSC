-- Create about_page table (single-row config for the "Sobre Nosotros" page)
CREATE TABLE about_page (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Sobre Nosotros',
  subtitle TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Single-row constraint via application logic (upsert always uses same id)
-- Seed the default row
INSERT INTO about_page (id, title, subtitle, content)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Sobre Nosotros',
  'Conocé nuestra historia',
  jsonb_build_object(
    'intro', 'En Chamical Candy Shop nos apasiona endulzar tu día.',
    'sections', jsonb_build_array(
      jsonb_build_object(
        'heading', 'Nuestra Historia',
        'paragraphs', jsonb_build_array(
          'Chamical Candy Shop nació del sueño de compartir los dulces más deliciosos con nuestra comunidad. Desde nuestros inicios, nos enfocamos en ofrecer productos de la mejor calidad, seleccionando cuidadosamente cada artículo que llega a nuestras estanterías.',
          'Lo que comenzó como un pequeño emprendimiento familiar, hoy es un punto de referencia en Chamical para los amantes de los dulces, golosinas y chocolates.'
        )
      ),
      jsonb_build_object(
        'heading', 'Nuestra Misión',
        'paragraphs', jsonb_build_array(
          'Ofrecer una experiencia única de compra, combinando la calidez de la atención personalizada con la variedad y calidad de nuestros productos. Creemos que cada visita a nuestra tienda debe ser un momento especial.'
        )
      ),
      jsonb_build_object(
        'heading', 'Nuestros Valores',
        'paragraphs', jsonb_build_array(
          'Calidad: Trabajamos solo con proveedores que comparten nuestro compromiso con la excelencia.',
          'Cercanía: Creemos en el trato personal y en conocer a nuestros clientes.',
          'Variedad: Nos esforzamos por ofrecer la más amplia selección de productos.'
        )
      )
    ),
    'image_url', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFnupY6X3OeWe0OGFu9RFhJShIgtvC_FkNPvWvsDQsEqMffRmytrJKsrR8MospRiGaPeWN7K3hfxXv6HatHiFZ0_wG2H_Xf7sWsZvFo_2ilbtQ5wuV1ETbk3t-y_1unWmzIIGkjZo8hiKVjZ28cx-jgKjYPdRIeqCp-229-FlxD82IPCvBVRhxQcqT5TQKiTdIpwcr6jZx9zh1EkT0m44G30LttcE1FzFxB475xHOk3HD4HIoRUXfpBW4kdmSfOMW9hal3MbRXNfQ',
    'stats', jsonb_build_array(
      jsonb_build_object('value', '50+', 'label', 'Productos'),
      jsonb_build_object('value', '5+', 'label', 'Categorías'),
      jsonb_build_object('value', '100%', 'label', 'Calidad'),
      jsonb_build_object('value', '🌟', 'label', 'Premium')
    )
  )
) ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE about_page ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read about_page"
  ON about_page FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can update about_page"
  ON about_page FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_about_page_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_about_page_timestamp
  BEFORE UPDATE ON about_page
  FOR EACH ROW
  EXECUTE FUNCTION update_about_page_timestamp();
