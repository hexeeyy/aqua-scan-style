-- Allow admins to delete any scan
CREATE POLICY "Admins can delete all scans"
ON public.scan_history
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update any scan
CREATE POLICY "Admins can update all scans"
ON public.scan_history
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));