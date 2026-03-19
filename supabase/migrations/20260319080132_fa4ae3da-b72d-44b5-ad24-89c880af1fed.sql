-- 1. Create locations table
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view locations"
  ON public.locations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can insert locations"
  ON public.locations FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update locations"
  ON public.locations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete locations"
  ON public.locations FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

-- 2. Add location_id to profiles
ALTER TABLE public.profiles ADD COLUMN location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;

-- 3. Upgrade existing admin to super_admin
UPDATE public.user_roles SET role = 'super_admin' WHERE role = 'admin';

-- 4. Update has_role so super_admin is a superset of all roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND (
      role = _role
      OR role = 'super_admin'
    )
  )
$$;