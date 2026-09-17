CREATE TABLE public.recursos_ministerio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  nivel TEXT NOT NULL DEFAULT 'ambos',
  grado TEXT,
  area TEXT,
  fuente TEXT DEFAULT 'https://materialeducativoperu.com/',
  archivo_url TEXT,
  contenido TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recursos_ministerio TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recursos_ministerio TO authenticated;
GRANT ALL ON public.recursos_ministerio TO service_role;
ALTER TABLE public.recursos_ministerio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recursos lectura publica" ON public.recursos_ministerio FOR SELECT USING (true);
CREATE POLICY "recursos insercion publica" ON public.recursos_ministerio FOR INSERT WITH CHECK (true);
CREATE POLICY "recursos borrado publico" ON public.recursos_ministerio FOR DELETE USING (true);

CREATE TABLE public.consultas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nivel TEXT NOT NULL,
  grado TEXT NOT NULL,
  area TEXT NOT NULL,
  pregunta TEXT NOT NULL,
  pistas JSONB NOT NULL DEFAULT '[]'::jsonb,
  estrategia TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.consultas TO anon;
GRANT SELECT, INSERT, DELETE ON public.consultas TO authenticated;
GRANT ALL ON public.consultas TO service_role;
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consultas lectura publica" ON public.consultas FOR SELECT USING (true);
CREATE POLICY "consultas insercion publica" ON public.consultas FOR INSERT WITH CHECK (true);
CREATE POLICY "consultas borrado publico" ON public.consultas FOR DELETE USING (true);

CREATE INDEX consultas_created_at_idx ON public.consultas (created_at DESC);