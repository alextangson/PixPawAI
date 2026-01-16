-- Create shared-cards storage bucket for Leica-style share cards
-- Safe version: drops existing policies first
-- Run this in Supabase SQL Editor

-- 1. Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('shared-cards', 'shared-cards', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can upload their own share cards" ON storage.objects;
DROP POLICY IF EXISTS "Public can view share cards" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own share cards" ON storage.objects;

-- 3. Create new policies

-- Policy: Allow authenticated users to upload their own share cards
CREATE POLICY "Users can upload their own share cards"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shared-cards' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow public read access to all share cards
CREATE POLICY "Public can view share cards"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'shared-cards');

-- Policy: Allow users to delete their own share cards
CREATE POLICY "Users can delete their own share cards"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'shared-cards' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
