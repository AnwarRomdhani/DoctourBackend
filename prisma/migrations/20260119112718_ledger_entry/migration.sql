-- CreateEnum
CREATE TYPE "public"."LedgerType" AS ENUM ('PAYMENT', 'REFUND', 'NO_SHOW_REFUND', 'DOCTOR_EARNINGS', 'SYSTEM_CUT');

-- CreateTable
CREATE TABLE "public"."Ledger" (
    "id" SERIAL NOT NULL,
    "consultationId" INTEGER,
    "fromUserId" INTEGER,
    "toUserId" INTEGER NOT NULL,
    "type" "public"."LedgerType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ledger_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Ledger" ADD CONSTRAINT "Ledger_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "public"."Consultation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Ledger" ADD CONSTRAINT "Ledger_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Ledger" ADD CONSTRAINT "Ledger_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
