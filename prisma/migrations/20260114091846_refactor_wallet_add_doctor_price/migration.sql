/*
  Warnings:

  - You are about to alter the column `coinBalance` on the `User` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "public"."Doctor" ADD COLUMN     "consultationPrice" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "lockedCoins" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "coinBalance" SET DEFAULT 0,
ALTER COLUMN "coinBalance" SET DATA TYPE INTEGER;
