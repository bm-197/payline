ALTER TABLE "business_profile" ADD COLUMN "next_client_seq" integer DEFAULT 1001 NOT NULL;--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN "customer_number" integer;--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN "next_invoice_seq" integer DEFAULT 1 NOT NULL;