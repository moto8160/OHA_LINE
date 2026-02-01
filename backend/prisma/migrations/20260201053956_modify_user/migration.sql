/*
  Warnings:

  - You are about to drop the column `linkToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `linkTokenExpiresAt` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_linkToken_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "linkToken",
DROP COLUMN "linkTokenExpiresAt";
