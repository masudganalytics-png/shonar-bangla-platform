DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;

CREATE POLICY "reviews_public_read" ON public.reviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = reviews.listing_id AND l.status = 'approved'
  )
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = reviews.listing_id AND l.owner_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);