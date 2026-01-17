-- Create merch_waitlist table
-- Stores email addresses of users interested in PixPaw merchandise

CREATE TABLE IF NOT EXISTS merch_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,
  pet_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_merch_waitlist_email ON merch_waitlist(email);

-- Add index for generation_id
CREATE INDEX IF NOT EXISTS idx_merch_waitlist_generation_id ON merch_waitlist(generation_id);

-- Add comment
COMMENT ON TABLE merch_waitlist IS 'Stores email addresses from users interested in PixPaw merchandise (fake door experiment)';
