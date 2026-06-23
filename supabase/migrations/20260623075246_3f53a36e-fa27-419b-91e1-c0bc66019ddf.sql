
-- 1. Verification status enum
DO $$ BEGIN
  CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Extend providers with onboarding fields
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS availability jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS price_min numeric(10,2),
  ADD COLUMN IF NOT EXISTS price_max numeric(10,2),
  ADD COLUMN IF NOT EXISTS license_doc_path text,
  ADD COLUMN IF NOT EXISTS license_doc_name text,
  ADD COLUMN IF NOT EXISTS verification_status public.verification_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;

-- 3. New pros: hide listing until they finish onboarding
ALTER TABLE public.providers ALTER COLUMN is_active SET DEFAULT false;

-- Update the new-user trigger to keep listings inactive until onboarding completes.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _role public.app_role;
  _category public.provider_category;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, city, bio, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'city',
    NEW.raw_user_meta_data ->> 'bio',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );

  _role := COALESCE(
    (NEW.raw_user_meta_data ->> 'role')::public.app_role,
    'customer'::public.app_role
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);

  IF _role = 'provider' THEN
    _category := COALESCE(
      (NEW.raw_user_meta_data ->> 'category')::public.provider_category,
      'handyman'::public.provider_category
    );

    INSERT INTO public.providers (user_id, category, headline, service_area, is_active)
    VALUES (
      NEW.id,
      _category,
      NEW.raw_user_meta_data ->> 'bio',
      NEW.raw_user_meta_data ->> 'city',
      false
    );
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 4. Refresh the sanitized public view with the new fields (no user_id, no license path)
DROP VIEW IF EXISTS public.public_providers;
CREATE VIEW public.public_providers
WITH (security_invoker = true) AS
SELECT
  p.id,
  p.category,
  p.headline,
  p.hourly_rate,
  p.price_min,
  p.price_max,
  p.years_experience,
  p.service_area,
  p.availability,
  p.verification_status,
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

-- 5. RLS policies for storage.objects on the provider-docs bucket
-- (The bucket itself is created via the storage tool.)
DROP POLICY IF EXISTS "Pros can upload their own license docs" ON storage.objects;
DROP POLICY IF EXISTS "Pros can read their own license docs" ON storage.objects;
DROP POLICY IF EXISTS "Pros can update their own license docs" ON storage.objects;
DROP POLICY IF EXISTS "Pros can delete their own license docs" ON storage.objects;

CREATE POLICY "Pros can upload their own license docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'provider-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Pros can read their own license docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'provider-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Pros can update their own license docs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'provider-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Pros can delete their own license docs"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'provider-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
