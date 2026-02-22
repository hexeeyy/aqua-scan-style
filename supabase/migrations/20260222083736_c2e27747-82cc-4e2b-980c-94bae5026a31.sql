
-- Add share_token for public QR access
ALTER TABLE public.scan_history
ADD COLUMN share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex');

-- Store market duration and consumer recommendation as JSON
ALTER TABLE public.scan_history
ADD COLUMN market_duration JSONB,
ADD COLUMN consumer_recommendation JSONB;

-- Create index for fast share_token lookups
CREATE INDEX idx_scan_history_share_token ON public.scan_history(share_token);

-- Allow anonymous public access by share_token (no auth required)
CREATE POLICY "Anyone can view scans by share_token"
ON public.scan_history
FOR SELECT
USING (share_token IS NOT NULL);
