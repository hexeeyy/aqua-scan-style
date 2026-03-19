-- Add approved column to profiles (default false for new users)
ALTER TABLE public.profiles ADD COLUMN approved boolean NOT NULL DEFAULT false;

-- Auto-approve existing users (they were already using the system)
UPDATE public.profiles SET approved = true;

-- Update the handle_new_user function to set approved = false for new signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, approved)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), false);
  RETURN NEW;
END;
$function$;