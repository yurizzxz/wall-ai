CREATE TYPE "public"."finance_account_type" AS ENUM('CHECKING', 'SAVINGS', 'CASH', 'INVESTMENT');--> statement-breakpoint
CREATE TYPE "public"."finance_category_kind" AS ENUM('INCOME', 'EXPENSE', 'BOTH');--> statement-breakpoint
CREATE TYPE "public"."finance_debt_status" AS ENUM('OPEN', 'OVERDUE', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."finance_invoice_status" AS ENUM('OPEN', 'CLOSED', 'OVERDUE', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."finance_payment_method" AS ENUM('CASH', 'PIX', 'DEBIT_CARD', 'BANK_TRANSFER', 'CREDIT_CARD');--> statement-breakpoint
CREATE TYPE "public"."finance_recurrence_frequency" AS ENUM('WEEKLY', 'MONTHLY', 'YEARLY');--> statement-breakpoint
CREATE TYPE "public"."finance_savings_goal_status" AS ENUM('ACTIVE', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."finance_transaction_kind" AS ENUM('INCOME', 'EXPENSE');--> statement-breakpoint
CREATE TYPE "public"."finance_transaction_status" AS ENUM('PENDING', 'SETTLED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "auth_account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "auth_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "auth_user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "auth_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "auth_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"kind" "finance_category_kind" NOT NULL,
	"color" text,
	"icon" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_card_installment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_id" uuid NOT NULL,
	"invoice_id" uuid,
	"number" integer NOT NULL,
	"total_count" integer NOT NULL,
	"amount_in_cents" integer NOT NULL,
	"due_at" timestamp (3) with time zone NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_card" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"last_four" varchar(4),
	"limit_in_cents" integer NOT NULL,
	"closing_day" integer NOT NULL,
	"due_day" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_card_limit_positive_chk" CHECK ("credit_card"."limit_in_cents" > 0),
	CONSTRAINT "credit_card_closing_day_range_chk" CHECK ("credit_card"."closing_day" between 1 and 28),
	CONSTRAINT "credit_card_due_day_range_chk" CHECK ("credit_card"."due_day" between 1 and 28)
);
--> statement-breakpoint
CREATE TABLE "debt_payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"debt_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"transaction_id" uuid,
	"amount_in_cents" integer NOT NULL,
	"paid_at" timestamp (3) with time zone NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "debt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"creditor" text NOT NULL,
	"description" text NOT NULL,
	"total_in_cents" integer NOT NULL,
	"paid_in_cents" integer DEFAULT 0 NOT NULL,
	"due_at" timestamp (3) with time zone,
	"status" "finance_debt_status" DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "finance_account_type" NOT NULL,
	"currency" varchar(3) DEFAULT 'BRL' NOT NULL,
	"initial_balance_in_cents" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "financial_account_initial_balance_non_negative_chk" CHECK ("financial_account"."initial_balance_in_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "invoice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"credit_card_id" uuid NOT NULL,
	"total_in_cents" integer DEFAULT 0 NOT NULL,
	"paid_in_cents" integer DEFAULT 0 NOT NULL,
	"status" "finance_invoice_status" DEFAULT 'OPEN' NOT NULL,
	"period_start" timestamp (3) with time zone NOT NULL,
	"period_end" timestamp (3) with time zone NOT NULL,
	"closing_at" timestamp (3) with time zone NOT NULL,
	"due_at" timestamp (3) with time zone NOT NULL,
	"paid_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_totals_chk" CHECK ("invoice"."total_in_cents" >= 0 and "invoice"."paid_in_cents" >= 0 and "invoice"."paid_in_cents" <= "invoice"."total_in_cents"),
	CONSTRAINT "invoice_period_chk" CHECK ("invoice"."period_end" >= "invoice"."period_start")
);
--> statement-breakpoint
CREATE TABLE "recurring_transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"account_id" uuid,
	"category_id" uuid NOT NULL,
	"credit_card_id" uuid,
	"description" text NOT NULL,
	"amount_in_cents" integer NOT NULL,
	"kind" "finance_transaction_kind" NOT NULL,
	"payment_method" "finance_payment_method" NOT NULL,
	"frequency" "finance_recurrence_frequency" NOT NULL,
	"next_occurrence_at" timestamp (3) with time zone NOT NULL,
	"ends_at" timestamp (3) with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "savings_contribution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"savings_goal_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"transaction_id" uuid,
	"amount_in_cents" integer NOT NULL,
	"contributed_at" timestamp (3) with time zone NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "savings_goal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"target_in_cents" integer NOT NULL,
	"saved_in_cents" integer DEFAULT 0 NOT NULL,
	"deadline" timestamp (3) with time zone,
	"status" "finance_savings_goal_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"account_id" uuid,
	"category_id" uuid NOT NULL,
	"credit_card_id" uuid,
	"paid_invoice_id" uuid,
	"source_recurring_transaction_id" uuid,
	"description" text NOT NULL,
	"notes" text,
	"amount_in_cents" integer NOT NULL,
	"kind" "finance_transaction_kind" NOT NULL,
	"status" "finance_transaction_status" DEFAULT 'PENDING' NOT NULL,
	"payment_method" "finance_payment_method" NOT NULL,
	"occurred_at" timestamp (3) with time zone NOT NULL,
	"due_at" timestamp (3) with time zone,
	"settled_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth_account" ADD CONSTRAINT "auth_account_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_card_installment" ADD CONSTRAINT "credit_card_installment_purchase_id_transaction_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."transaction"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_card_installment" ADD CONSTRAINT "credit_card_installment_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_card" ADD CONSTRAINT "credit_card_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_payment" ADD CONSTRAINT "debt_payment_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_payment" ADD CONSTRAINT "debt_payment_debt_id_debt_id_fk" FOREIGN KEY ("debt_id") REFERENCES "public"."debt"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_payment" ADD CONSTRAINT "debt_payment_account_id_financial_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."financial_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_payment" ADD CONSTRAINT "debt_payment_transaction_id_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt" ADD CONSTRAINT "debt_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_account" ADD CONSTRAINT "financial_account_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_credit_card_id_credit_card_id_fk" FOREIGN KEY ("credit_card_id") REFERENCES "public"."credit_card"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "credit_card_user_id_id_unique" ON "credit_card" USING btree ("user_id","id");--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_user_credit_card_fk" FOREIGN KEY ("user_id","credit_card_id") REFERENCES "public"."credit_card"("user_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_transaction" ADD CONSTRAINT "recurring_transaction_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_transaction" ADD CONSTRAINT "recurring_transaction_account_id_financial_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."financial_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_transaction" ADD CONSTRAINT "recurring_transaction_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_transaction" ADD CONSTRAINT "recurring_transaction_credit_card_id_credit_card_id_fk" FOREIGN KEY ("credit_card_id") REFERENCES "public"."credit_card"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_contribution" ADD CONSTRAINT "savings_contribution_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_contribution" ADD CONSTRAINT "savings_contribution_savings_goal_id_savings_goal_id_fk" FOREIGN KEY ("savings_goal_id") REFERENCES "public"."savings_goal"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_contribution" ADD CONSTRAINT "savings_contribution_account_id_financial_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."financial_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_contribution" ADD CONSTRAINT "savings_contribution_transaction_id_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_goal" ADD CONSTRAINT "savings_goal_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_account_id_financial_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."financial_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_credit_card_id_credit_card_id_fk" FOREIGN KEY ("credit_card_id") REFERENCES "public"."credit_card"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_paid_invoice_id_invoice_id_fk" FOREIGN KEY ("paid_invoice_id") REFERENCES "public"."invoice"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_source_recurring_transaction_id_recurring_transaction_id_fk" FOREIGN KEY ("source_recurring_transaction_id") REFERENCES "public"."recurring_transaction"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_account_user_id_idx" ON "auth_account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_session_user_id_idx" ON "auth_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_verification_identifier_idx" ON "auth_verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "category_user_id_name_kind_unique" ON "category" USING btree ("user_id","name","kind");--> statement-breakpoint
CREATE INDEX "category_user_id_is_active_idx" ON "category" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "category_user_id_id_unique" ON "category" USING btree ("user_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_card_installment_purchase_id_number_unique" ON "credit_card_installment" USING btree ("purchase_id","number");--> statement-breakpoint
CREATE INDEX "credit_card_installment_invoice_id_idx" ON "credit_card_installment" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "credit_card_installment_due_at_idx" ON "credit_card_installment" USING btree ("due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_card_user_id_name_unique" ON "credit_card" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "credit_card_user_id_is_active_idx" ON "credit_card" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "debt_payment_transaction_id_unique" ON "debt_payment" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "debt_payment_debt_id_paid_at_idx" ON "debt_payment" USING btree ("debt_id","paid_at");--> statement-breakpoint
CREATE INDEX "debt_payment_user_id_paid_at_idx" ON "debt_payment" USING btree ("user_id","paid_at");--> statement-breakpoint
CREATE INDEX "debt_user_id_status_due_at_idx" ON "debt" USING btree ("user_id","status","due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "financial_account_user_id_name_unique" ON "financial_account" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "financial_account_user_id_is_active_idx" ON "financial_account" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "financial_account_user_id_id_unique" ON "financial_account" USING btree ("user_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_credit_card_id_period_start_unique" ON "invoice" USING btree ("credit_card_id","period_start");--> statement-breakpoint
CREATE INDEX "invoice_user_id_status_due_at_idx" ON "invoice" USING btree ("user_id","status","due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_user_id_id_unique" ON "invoice" USING btree ("user_id","id");--> statement-breakpoint
CREATE INDEX "recurring_transaction_user_active_next_idx" ON "recurring_transaction" USING btree ("user_id","is_active","next_occurrence_at");--> statement-breakpoint
CREATE UNIQUE INDEX "savings_contribution_transaction_id_unique" ON "savings_contribution" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "savings_contribution_goal_id_contributed_at_idx" ON "savings_contribution" USING btree ("savings_goal_id","contributed_at");--> statement-breakpoint
CREATE INDEX "savings_contribution_user_id_contributed_at_idx" ON "savings_contribution" USING btree ("user_id","contributed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "savings_goal_user_id_name_unique" ON "savings_goal" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "savings_goal_user_id_status_deadline_idx" ON "savings_goal" USING btree ("user_id","status","deadline");--> statement-breakpoint
CREATE INDEX "transaction_user_id_occurred_at_idx" ON "transaction" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "transaction_user_id_status_due_at_idx" ON "transaction" USING btree ("user_id","status","due_at");--> statement-breakpoint
CREATE INDEX "transaction_account_id_status_idx" ON "transaction" USING btree ("account_id","status");--> statement-breakpoint
CREATE INDEX "transaction_credit_card_id_occurred_at_idx" ON "transaction" USING btree ("credit_card_id","occurred_at");--> statement-breakpoint
CREATE INDEX "transaction_source_recurring_transaction_id_idx" ON "transaction" USING btree ("source_recurring_transaction_id");
