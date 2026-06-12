-- Collection table — curated starter models customers can clone.
-- Owned by the panel; furniture-designer reads it as a read-only mirror.
--
-- Standalone, idempotent migration. The panel otherwise manages its schema with
-- `bun run db:push`; this file is provided so the collection table can be added
-- to an existing database without a full drizzle baseline (furniture_model,
-- artwork and price already exist). Apply with:
--   psql "$DATABASE_URL" -f migrations/0001_collection.sql
-- or simply run `bun run db:push` from the panel.

CREATE TABLE IF NOT EXISTS "collection" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"version" text NOT NULL
);
