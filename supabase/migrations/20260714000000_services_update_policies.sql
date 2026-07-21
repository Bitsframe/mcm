-- Allow CMS updates for website services (English + Spanish).
-- Previously only SELECT policies existed, so browser updates appeared to succeed but did not persist.

CREATE POLICY "Enable update access for all users"
  ON public.services
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
  ON public.services_es
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);
