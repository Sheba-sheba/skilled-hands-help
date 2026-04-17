-- Provider categories enum
CREATE TYPE public.provider_category AS ENUM ('plumber', 'electrician', 'handyman', 'cleaner');

-- Booking status enum
CREATE TYPE public.booking_status AS ENUM ('pending', 'accepted', 'declined', 'completed', 'cancelled');

-- Providers table
CREATE TABLE public.providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  category public.provider_category NOT NULL DEFAULT 'handyman',
  headline TEXT,
  hourly_rate NUMERIC(10, 2),
  years_experience INT,
  service_area TEXT,
  rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
  review_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active providers are viewable by everyone"
  ON public.providers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Providers can update their own row"
  ON public.providers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Providers can insert their own row"
  ON public.providers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_providers_updated_at
  BEFORE UPDATE ON public.providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_providers_category ON public.providers(category) WHERE is_active = true;

-- Bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  address TEXT NOT NULL,
  job_description TEXT NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Customers see their own bookings
CREATE POLICY "Customers can view their own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = customer_id);

-- Providers see bookings for their provider row
CREATE POLICY "Providers can view bookings on their listing"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = provider_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can create their own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can cancel their own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = customer_id);

CREATE POLICY "Providers can update bookings on their listing"
  ON public.bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = provider_id AND p.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX idx_bookings_provider ON public.bookings(provider_id);

-- Validation trigger: scheduled_date must be today or future
CREATE OR REPLACE FUNCTION public.validate_booking_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.scheduled_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Booking date cannot be in the past';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_booking_date_trigger
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.validate_booking_date();

-- Update handle_new_user to auto-create provider row for Pros
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Auto-create provider listing for Pros
  IF _role = 'provider' THEN
    _category := COALESCE(
      (NEW.raw_user_meta_data ->> 'category')::public.provider_category,
      'handyman'::public.provider_category
    );

    INSERT INTO public.providers (user_id, category, headline, service_area)
    VALUES (
      NEW.id,
      _category,
      NEW.raw_user_meta_data ->> 'bio',
      NEW.raw_user_meta_data ->> 'city'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();