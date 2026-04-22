-- Roles
CREATE TYPE public.app_role AS ENUM ('citizen', 'admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'citizen',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Cases
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  raw_input TEXT NOT NULL,
  transcript TEXT,
  voice_url TEXT,
  district TEXT,
  state TEXT,
  category TEXT,
  subcategory TEXT,
  urgency TEXT DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'submitted',
  anonymous BOOLEAN NOT NULL DEFAULT true,
  contact_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

CREATE INDEX cases_created_at_idx ON public.cases(created_at DESC);
CREATE INDEX cases_district_idx ON public.cases(district);
CREATE INDEX cases_category_idx ON public.cases(category);
CREATE INDEX cases_session_idx ON public.cases(session_id);

CREATE POLICY "anyone can create case" ON public.cases FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "users read own cases" ON public.cases FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "anon read by session" ON public.cases FOR SELECT TO anon USING (session_id IS NOT NULL);
CREATE POLICY "admins read all cases" ON public.cases FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users update own cases" ON public.cases FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "anon update by session" ON public.cases FOR UPDATE TO anon USING (session_id IS NOT NULL);

-- Agent runs
CREATE TABLE public.agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  agent TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  input JSONB,
  output JSONB,
  duration_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
CREATE INDEX agent_runs_case_idx ON public.agent_runs(case_id);

CREATE POLICY "users read own agent runs" ON public.agent_runs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_id AND c.user_id = auth.uid()));
CREATE POLICY "anon read by session" ON public.agent_runs FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_id AND c.session_id IS NOT NULL));
CREATE POLICY "admins read all agent runs" ON public.agent_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Generated documents
CREATE TABLE public.generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body_markdown TEXT NOT NULL,
  recipient TEXT,
  jurisdiction TEXT,
  aid_contact JSONB,
  pdf_path TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX gen_docs_case_idx ON public.generated_documents(case_id);

CREATE POLICY "users read own docs" ON public.generated_documents FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_id AND c.user_id = auth.uid()));
CREATE POLICY "anon read by session" ON public.generated_documents FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_id AND c.session_id IS NOT NULL));
CREATE POLICY "admins read all docs" ON public.generated_documents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Aggregated view for dashboard (admin only via underlying cases policy)
CREATE OR REPLACE VIEW public.cases_aggregate
WITH (security_invoker = true) AS
SELECT
  date_trunc('day', created_at) AS day,
  COALESCE(district, 'Unknown') AS district,
  COALESCE(state, 'Unknown') AS state,
  COALESCE(category, 'Unknown') AS category,
  language,
  COUNT(*)::INT AS case_count
FROM public.cases
GROUP BY 1,2,3,4,5;

-- Storage bucket for generated PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('legal-docs', 'legal-docs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public read legal docs" ON storage.objects FOR SELECT USING (bucket_id = 'legal-docs');
CREATE POLICY "service writes legal docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'legal-docs');