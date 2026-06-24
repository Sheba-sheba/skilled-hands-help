-- Fix admin role escalation via signup metadata: whitelist only safe roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _requested text;
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

  _requested := NEW.raw_user_meta_data ->> 'role';
  -- Never trust client metadata for privileged roles.
  -- Only 'provider' may be self-selected; everyone else is 'customer'.
  -- 'admin' can only be granted via service_role.
  IF _requested = 'provider' THEN
    _role := 'provider'::public.app_role;
  ELSE
    _role := 'customer'::public.app_role;
  END IF;

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

-- Lock down SECURITY DEFINER functions: revoke broad EXECUTE, grant only where needed
REVOKE EXECUTE ON FUNCTION public.get_my_provider_license() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_provider_license() TO authenticated;

-- handle_new_user is a trigger function on auth.users; no role needs direct EXECUTE
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;