-- Allow citizens to delete their own establishments when status is pending_verification
CREATE POLICY "Own establishments delete when pending"
ON public.establishments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND status IN ('pending_verification', 'submitted'));