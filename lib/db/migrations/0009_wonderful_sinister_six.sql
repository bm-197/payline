ALTER TABLE "business_profile" DROP CONSTRAINT "business_profile_user_id_unique";--> statement-breakpoint
DROP INDEX "client_user_idx";--> statement-breakpoint
DROP INDEX "invoice_user_idx";--> statement-breakpoint
DROP INDEX "invoice_user_number_idx";--> statement-breakpoint
ALTER TABLE "business_profile" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "client" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice" ALTER COLUMN "organization_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "client_org_idx" ON "client" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invoice_org_idx" ON "invoice" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_org_number_idx" ON "invoice" USING btree ("organization_id","number");--> statement-breakpoint
ALTER TABLE "business_profile" ADD CONSTRAINT "business_profile_organization_id_unique" UNIQUE("organization_id");