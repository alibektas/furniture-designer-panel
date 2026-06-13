CREATE TABLE "artwork" (
	"id" text PRIMARY KEY NOT NULL,
	"unique_id" text NOT NULL,
	"name" text NOT NULL,
	"width_cm" integer NOT NULL,
	"height_cm" integer NOT NULL,
	"side" text NOT NULL,
	"price" double precision NOT NULL,
	"object_key" text NOT NULL,
	"thumb_key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collection" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"version" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "furniture_model" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text,
	"data" jsonb NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"version" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price" (
	"prop_id" text PRIMARY KEY NOT NULL,
	"value" double precision NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "artwork_unique_id_idx" ON "artwork" USING btree ("unique_id");