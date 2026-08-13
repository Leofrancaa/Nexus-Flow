CREATE TABLE "pluggy_webhook_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"event" text NOT NULL,
	"item_id" text,
	"status" text DEFAULT 'received' NOT NULL,
	"error" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pluggy_webhook_events_event_id_unique" UNIQUE("event_id")
);--> statement-breakpoint

ALTER TABLE "pluggy_webhook_events" ENABLE ROW LEVEL SECURITY;
