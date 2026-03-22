CREATE INDEX IF NOT EXISTS idx_scan_history_user_id ON public.scan_history (user_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_timestamp ON public.scan_history (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_scan_history_user_timestamp ON public.scan_history (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_scan_history_share_token ON public.scan_history (share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);