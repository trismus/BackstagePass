-- Create storage bucket for feedback screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feedback-screenshots',
  'feedback-screenshots',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
) ON CONFLICT (id) DO NOTHING;

-- INSERT: alle authentifizierten User
CREATE POLICY "Authenticated users can upload feedback-screenshots"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'feedback-screenshots');

-- SELECT: public (damit GitHub Bilder laden kann)
CREATE POLICY "Public can read feedback-screenshots"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'feedback-screenshots');

-- DELETE: nur Admins
CREATE POLICY "Admins can delete feedback-screenshots"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'feedback-screenshots' AND is_admin());
