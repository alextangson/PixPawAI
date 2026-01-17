-- Add other_reason field to generation_feedback table
-- Migration: 20260117_add_other_reason_field

ALTER TABLE generation_feedback
ADD COLUMN IF NOT EXISTS other_reason TEXT;

COMMENT ON COLUMN generation_feedback.other_reason IS 'User-provided custom feedback reason';
