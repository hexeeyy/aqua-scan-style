
-- Add location columns to scan_history
ALTER TABLE public.scan_history
  ADD COLUMN latitude numeric NULL,
  ADD COLUMN longitude numeric NULL,
  ADD COLUMN location_name text NULL;

-- Index for location-based queries
CREATE INDEX idx_scan_history_location_name ON public.scan_history (location_name);
