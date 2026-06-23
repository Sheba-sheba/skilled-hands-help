
-- 1. Drop unused pg_graphql extension to eliminate GraphQL exposure of every public object.
DROP EXTENSION IF EXISTS pg_graphql CASCADE;

-- 2. Move has_role() into a private schema not exposed by PostgREST.
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, anon, service_role;

-- Replace policies that referenced public.has_role with private.has_role.
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Drop the public has_role function so it is no longer API-callable.
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 3. Restrict providers SELECT to signed-in users and expose a sanitized public view.
DROP POLICY IF EXISTS "Active providers are viewable by everyone" ON public.providers;

CREATE POLICY "Authenticated users can view active providers"
  ON public.providers FOR SELECT TO authenticated
  USING (is_active = true OR auth.uid() = user_id);

CREATE OR REPLACE VIEW public.public_providers
WITH (security_invoker = true) AS
SELECT
  p.id,
  p.category,
  p.headline,
  p.hourly_rate,
  p.years_experience,
  p.service_area,
  p.rating,
  p.review_count,
  p.is_active,
  p.created_at,
  pp.full_name,
  pp.avatar_url,
  pp.city,
  pp.bio
FROM public.providers p
LEFT JOIN public.public_profiles pp ON pp.user_id = p.user_id
WHERE p.is_active = true;

GRANT SELECT ON public.public_providers TO anon, authenticated;
