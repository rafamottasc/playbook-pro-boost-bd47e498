-- Add CRECI field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS creci text;