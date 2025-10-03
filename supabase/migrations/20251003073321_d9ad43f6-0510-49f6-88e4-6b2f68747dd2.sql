-- Create resources storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for resource uploads
CREATE POLICY "Anyone can view resources" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'resources');

CREATE POLICY "Admins can upload resources" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'resources' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update resources" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'resources' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete resources" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'resources' 
  AND has_role(auth.uid(), 'admin'::app_role)
);