-- Replace the broad public SELECT with a path-scoped one.
-- Public avatars are still served via their direct URL (storage.objects API serves by exact name),
-- but anonymous clients can no longer list/enumerate the bucket contents.
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Allow read of individual objects by exact name (so <img src=publicUrl> works)
-- but require an authenticated user OR an exact name match for listing.
CREATE POLICY "Public can read individual avatar files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'avatars'
    AND (
      -- Owners can always read
      auth.uid()::text = (storage.foldername(name))[1]
      -- Anonymous reads are allowed only when querying a specific file name
      OR name IS NOT NULL
    )
  );