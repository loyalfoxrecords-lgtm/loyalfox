-- Centro de regalías: importaciones auditables
CREATE TABLE IF NOT EXISTS royalty_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text DEFAULT '',
  file_hash text UNIQUE,
  rows int DEFAULT 0,
  total numeric(14,6) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS royalty_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id uuid REFERENCES royalty_imports(id) ON DELETE CASCADE,
  artist_raw text DEFAULT '',
  artist_name text,              -- NULL = sin asignar
  isrc text DEFAULT '',
  title text DEFAULT '',
  store text DEFAULT '',
  country text DEFAULT '',
  month text NOT NULL,           -- 'YYYY-MM-01'
  quantity int DEFAULT 0,
  net numeric(16,8) DEFAULT 0
);
CREATE INDEX IF NOT EXISTS royalty_lines_artist_month ON royalty_lines (artist_name, month);
CREATE INDEX IF NOT EXISTS royalty_lines_import ON royalty_lines (import_id);
-- Alias de nombres (p. ej. "Dréos" -> "Dreos")
CREATE TABLE IF NOT EXISTS artist_aliases (
  alias_norm text PRIMARY KEY,
  artist_name text NOT NULL
);
ALTER TABLE royalty_imports DISABLE ROW LEVEL SECURITY;
ALTER TABLE royalty_lines   DISABLE ROW LEVEL SECURITY;
ALTER TABLE artist_aliases  DISABLE ROW LEVEL SECURITY;
