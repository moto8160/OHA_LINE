/*
  Warnings:

  - You are about to drop the column `lineToken` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "lineToken",
ADD COLUMN     "lineDisplayName" TEXT,
ADD COLUMN     "linePictureUrl" TEXT;
