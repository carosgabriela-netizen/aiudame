CREATE POLICY "material lectura publica" ON storage.objects FOR SELECT USING (bucket_id = 'material-ministerio');
CREATE POLICY "material subida publica" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'material-ministerio');
CREATE POLICY "material borrado publico" ON storage.objects FOR DELETE USING (bucket_id = 'material-ministerio');