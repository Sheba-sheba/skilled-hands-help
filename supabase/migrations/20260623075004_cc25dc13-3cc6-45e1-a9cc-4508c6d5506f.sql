
-- 1. Scope booking + profile policies to authenticated only (no anon).
DROP POLICY IF EXISTS "Customers can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Customers can cancel their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Customers can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Providers can update bookings on their listing" ON public.bookings;
DROP POLICY IF EXISTS "Providers can view bookings on their listing" ON public.bookings;

CREATE POLICY "Customers can create their own bookings"
  ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can cancel their own bookings"
  ON public.bookings FOR UPDATE TO authenticated
  USING (auth.uid() = customer_id);

CREATE POLICY "Customers can view their own bookings"
  ON public.bookings FOR SELECT TO authenticated
  USING (auth.uid() = customer_id);

CREATE POLICY "Providers can update bookings on their listing"
  ON public.bookings FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.providers p
    WHERE p.id = bookings.provider_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Providers can view bookings on their listing"
  ON public.bookings FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.providers p
    WHERE p.id = bookings.provider_id AND p.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- 2. Allow providers to read profiles of customers who have booked them.
CREATE POLICY "Providers can view their customers' profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.bookings b
    JOIN public.providers p ON p.id = b.provider_id
    WHERE b.customer_id = profiles.user_id
      AND p.user_id = auth.uid()
  ));
