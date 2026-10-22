-- Método de pago
ALTER TABLE artist_accounts ADD COLUMN IF NOT EXISTS paypal_email text DEFAULT '';
ALTER TABLE artist_accounts ADD COLUMN IF NOT EXISTS bank_iban text DEFAULT '';
ALTER TABLE artist_accounts ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'paypal';

-- Pipeline de lanzamientos
ALTER TABLE release_submissions ADD COLUMN IF NOT EXISTS stage text DEFAULT 'info';
ALTER TABLE release_submissions ADD COLUMN IF NOT EXISTS distribution_at timestamptz;
ALTER TABLE release_submissions ADD COLUMN IF NOT EXISTS release_date date;
ALTER TABLE release_submissions ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- Prueba social
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text DEFAULT '',
  quote text NOT NULL,
  image_url text DEFAULT '',
  track_url text DEFAULT '',
  published boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE testimonials DISABLE ROW LEVEL SECURITY;
