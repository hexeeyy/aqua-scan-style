-- Drop the overly broad share_token policy that leaks all scans to all users
DROP POLICY "Anyone can view scans by share_token" ON public.scan_history;

-- Re-create it scoped to anon role only (for the public scan page)
CREATE POLICY "Anon can view scans by share_token"
ON public.scan_history FOR SELECT TO anon
USING (share_token IS NOT NULL);