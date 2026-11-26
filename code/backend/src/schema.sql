CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  google_id TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin')),
  mobile_number TEXT,
  house_flat_number TEXT,
  street_locality TEXT,
  area_ward TEXT,
  city TEXT,
  state TEXT,
  profile_pin_code TEXT,
  profile_landmark TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'English'
    CHECK (preferred_language IN ('English', 'Hindi')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (password_hash IS NOT NULL OR google_id IS NOT NULL)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS house_flat_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS street_locality TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS area_ward TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_pin_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_landmark TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'English';

CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  complaint_type TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'Urgent')),
  address TEXT NOT NULL,
  pin_code TEXT NOT NULL,
  landmark TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  ward TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending Dispatch'
    CHECK (status IN ('Pending Dispatch', 'In Progress', 'Resolved')),
  admin_feedback TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS complaints_user_created_idx
  ON complaints (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS complaints_created_idx
  ON complaints (created_at DESC);

CREATE TABLE IF NOT EXISTS complaint_attachments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_data BYTEA NOT NULL
);

CREATE TABLE IF NOT EXISTS complaint_updates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('Pending Dispatch', 'In Progress', 'Resolved')),
  feedback TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
