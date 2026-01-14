-- Add Sirplay-specific identifiers to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS sirplay_user_id text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS sirplay_customer_id text;
