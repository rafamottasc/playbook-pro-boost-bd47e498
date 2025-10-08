-- Create storage bucket for lesson materials if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-materials', 'lesson-materials', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for lesson-materials bucket
CREATE POLICY "Admins can upload lesson materials"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lesson-materials' 
  AND (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Admins can update lesson materials"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'lesson-materials'
  AND (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Admins can delete lesson materials"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'lesson-materials'
  AND (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Authenticated users can view lesson materials"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'lesson-materials');