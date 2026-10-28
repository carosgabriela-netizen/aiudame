ALTER TABLE public.consultas ADD COLUMN usuario_dni TEXT;
ALTER TABLE public.consultas ADD COLUMN usuario_nombre TEXT;
COMMENT ON COLUMN public.consultas.usuario_dni IS 'DNI del estudiante que hizo la consulta (opcional, autoidentificacion sin cuentas)';
COMMENT ON COLUMN public.consultas.usuario_nombre IS 'Nombre del estudiante cuando no conoce su DNI (sin apellidos)';