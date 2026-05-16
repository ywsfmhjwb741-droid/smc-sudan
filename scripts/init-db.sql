-- ============================================================
-- SMC Sudan MOBA Community - Database Initialization
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search

-- Create initial active season
-- (Drizzle migrations will handle the actual schema)
-- This script runs only on first initialization

SELECT 'SMC Sudan MOBA Community database initialized' AS status;
