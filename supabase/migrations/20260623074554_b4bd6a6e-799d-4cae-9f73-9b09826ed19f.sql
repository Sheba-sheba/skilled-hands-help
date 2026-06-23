
-- Drop admin policies that depended on the helper function.
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Drop the helper function — no remaining policy references it.
DROP FUNCTION IF EXISTS private.has_role(uuid, public.app_role);

-- Result: user_roles is readable only by the owner; all writes require service_role (backend).
