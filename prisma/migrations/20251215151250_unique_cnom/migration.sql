/*
  Warnings:

  - A unique constraint covering the columns `[CNOM]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_CNOM_key" ON "public"."User"("CNOM");
