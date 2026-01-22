-- AlterTable
ALTER TABLE "public"."Ledger" ADD COLUMN     "externalRef" TEXT,
ADD COLUMN     "settled" BOOLEAN NOT NULL DEFAULT false;
