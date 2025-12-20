-- Create storage bucket for member photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('member-photos', 'member-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload member photos
CREATE POLICY "Admins can upload member photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'member-photos' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow public read access to member photos
CREATE POLICY "Anyone can view member photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'member-photos');

-- Allow admins to update member photos
CREATE POLICY "Admins can update member photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'member-photos' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to delete member photos
CREATE POLICY "Admins can delete member photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'member-photos' 
  AND public.has_role(auth.uid(), 'admin')
);