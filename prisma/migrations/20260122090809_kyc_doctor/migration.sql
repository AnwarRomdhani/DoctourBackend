/*
  Warnings:

  - You are about to drop the column `CNOM` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `cin` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cin]` on the table `Patient` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cin` to the `Patient` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."KYCStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- DropIndex
DROP INDEX "public"."User_CNOM_key";

-- DropIndex
DROP INDEX "public"."User_cin_key";

-- AlterTable
ALTER TABLE "public"."Patient" ADD COLUMN     "cin" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "CNOM",
DROP COLUMN "cin";

-- CreateTable
CREATE TABLE "public"."DoctorKYC" (
    "id" SERIAL NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "cinNumber" TEXT NOT NULL,
    "cinFrontImageUrl" TEXT NOT NULL,
    "cinBackImageUrl" TEXT NOT NULL,
    "cnomProofUrl" TEXT NOT NULL,
    "status" "public"."KYCStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "DoctorKYC_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DoctorKYC_doctorId_key" ON "public"."DoctorKYC"("doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorKYC_cinNumber_key" ON "public"."DoctorKYC"("cinNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_cin_key" ON "public"."Patient"("cin");

-- AddForeignKey
ALTER TABLE "public"."DoctorKYC" ADD CONSTRAINT "DoctorKYC_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctor"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
