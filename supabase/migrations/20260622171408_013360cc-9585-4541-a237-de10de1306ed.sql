
-- 1) Fix avatars bucket SELECT policy: remove OR (name IS NOT NULL) bypass
DROP POLICY IF EXISTS "Public can read individual avatar files" ON storage.objects;
CREATE POLICY "Users can read their own avatar files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 2) Restrict profiles SELECT to owner; expose safe fields via a public view
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT user_id, full_name, avatar_url, city, bio
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Allow anon/authenticated to read non-sensitive profile fields needed by the view
-- via an additional permissive policy that only returns rows matching providers
CREATE POLICY "Public can view profiles of active providers (safe fields via view)"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.providers pr
    WHERE pr.user_id = profiles.user_id AND pr.is_active = true
  )
);

-- 3) Lock down user_roles: explicit restrictive policy preventing non-admin writes
CREATE POLICY "Only admins can insert roles"
ON public.user_roles AS RESTRICTIVE
FOR INSERT TO authenticated, anon
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
ON public.user_roles AS RESTRICTIVE
FOR UPDATE TO authenticated, anon
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles AS RESTRICTIVE
FOR DELETE TO authenticated, anon
USING (public.has_role(auth.uid(), 'admin'));
