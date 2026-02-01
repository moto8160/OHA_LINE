/*
  Warnings:

  - A unique constraint covering the columns `[lineToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lineToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_lineToken_key" ON "User"("lineToken");
