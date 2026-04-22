-- Tighten cases insert/update
DROP POLICY "anyone can create case" ON public.cases;
DROP POLICY "anon update by session" ON public.cases;
DROP POLICY "users update own cases" ON public.cases;

CREATE POLICY "anon create case with session" ON public.cases FOR INSERT TO anon
  WITH CHECK (session_id IS NOT NULL AND user_id IS NULL);
CREATE POLICY "auth create own case" ON public.cases FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR (user_id IS NULL AND session_id IS NOT NULL));
CREATE POLICY "auth update own case" ON public.cases FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "anon update own session case" ON public.cases FOR UPDATE TO anon
  USING (session_id IS NOT NULL AND user_id IS NULL)
  WITH CHECK (session_id IS NOT NULL AND user_id IS NULL);

-- Storage: drop overly permissive policies; bucket stays public for direct URL access
DROP POLICY IF EXISTS "public read legal docs" ON storage.objects;
DROP POLICY IF EXISTS "service writes legal docs" ON storage.objects;
-- No INSERT/SELECT policies => only service_role (bypasses RLS) can write/list.
-- Public files remain reachable via /storage/v1/object/public/legal-docs/<path>.