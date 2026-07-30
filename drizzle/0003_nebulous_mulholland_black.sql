CREATE TYPE "public"."finance_transaction_origin" AS ENUM('STANDARD', 'SAVINGS_CONTRIBUTION');--> statement-breakpoint
CREATE TABLE "telegram_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"telegram_user_id" text NOT NULL,
	"telegram_chat_id" text NOT NULL,
	"username" text,
	"first_name" text,
	"linked_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transaction" DROP CONSTRAINT "transaction_category_id_category_id_fk";
--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "origin" "finance_transaction_origin" DEFAULT 'STANDARD' NOT NULL;--> statement-breakpoint
ALTER TABLE "telegram_account" ADD CONSTRAINT "telegram_account_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "telegram_account_user_id_unique" ON "telegram_account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "telegram_account_telegram_user_id_unique" ON "telegram_account" USING btree ("telegram_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "telegram_account_chat_id_unique" ON "telegram_account" USING btree ("telegram_chat_id");--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_user_category_fk" FOREIGN KEY ("user_id","category_id") REFERENCES "public"."category"("user_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_category_required_chk" CHECK ((
        ("transaction"."origin" = 'SAVINGS_CONTRIBUTION' and "transaction"."category_id" is null)
        or
        ("transaction"."origin" = 'STANDARD' and "transaction"."category_id" is not null)
      ));