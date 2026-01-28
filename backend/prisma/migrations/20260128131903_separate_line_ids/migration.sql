/*
  Warnings:

  - You are about to drop the column `lineUserId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[lineLoginId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[lineMessagingId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lineLoginId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_lineUserId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "lineUserId",
ADD COLUMN     "lineLoginId" TEXT NOT NULL,
ADD COLUMN     "lineMessagingId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_lineLoginId_key" ON "User"("lineLoginId");

-- CreateIndex
CREATE UNIQUE INDEX "User_lineMessagingId_key" ON "User"("lineMessagingId");
