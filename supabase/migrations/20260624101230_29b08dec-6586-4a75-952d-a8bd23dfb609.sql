
-- 1. Hide license document path/name from other authenticated users (column-level)
REVOKE SELECT (license_doc_path, license_doc_name) ON public.providers FROM authenticated;
REVOKE SELECT (license_doc_path, license_doc_name) ON public.providers FROM anon;

CREATE OR REPLACE FUNCTION public.get_my_provider_license()
RETURNS TABLE (license_doc_path text, license_doc_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT license_doc_path, license_doc_name
  FROM public.providers
  WHERE user_id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_provider_license() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_provider_license() TO authenticated;

-- 2. Bookings: restrict customer UPDATE to cancellation only
DROP POLICY IF EXISTS "Customers can cancel their own bookings" ON public.bookings;

CREATE POLICY "Customers can cancel their own bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id AND status = 'cancelled');

-- Prevent customers from mutating non-cancellation fields even via UPDATE
CREATE OR REPLACE FUNCTION public.enforce_customer_booking_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Only apply when the actor is the customer (not the provider on their listing)
  IF auth.uid() = OLD.customer_id
     AND NOT EXISTS (
       SELECT 1 FROM public.providers p
       WHERE p.id = OLD.provider_id AND p.user_id = auth.uid()
     )
  THEN
    IF NEW.provider_id        IS DISTINCT FROM OLD.provider_id
       OR NEW.customer_id     IS DISTINCT FROM OLD.customer_id
       OR NEW.scheduled_date  IS DISTINCT FROM OLD.scheduled_date
       OR NEW.scheduled_time  IS DISTINCT FROM OLD.scheduled_time
       OR NEW.address         IS DISTINCT FROM OLD.address
       OR NEW.job_description IS DISTINCT FROM OLD.job_description
    THEN
      RAISE EXCEPTION 'Customers may only cancel a booking, not modify its details';
    END IF;

    IF NEW.status <> 'cancelled' THEN
      RAISE EXCEPTION 'Customers may only set status to cancelled';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_customer_booking_update ON public.bookings;
CREATE TRIGGER enforce_customer_booking_update
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.enforce_customer_booking_update();

-- 3. user_roles: explicit deny policies for INSERT/UPDATE/DELETE by non-service callers
CREATE POLICY "No self insert of roles"
ON public.user_roles
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "No self update of roles"
ON public.user_roles
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "No self delete of roles"
ON public.user_roles
FOR DELETE
TO authenticated, anon
USING (false);
