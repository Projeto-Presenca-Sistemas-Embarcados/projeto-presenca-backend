/*
  Warnings:

  - Added the required column `updatedAt` to the `Teacher` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Teacher" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "startTime" TEXT,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Teacher" ("email", "id", "name", "password", "startTime", "tagId", "tokenVersion", "createdAt", "updatedAt") SELECT "email", "id", "name", "password", "startTime", "tagId", 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "Teacher";
DROP TABLE "Teacher";
ALTER TABLE "new_Teacher" RENAME TO "Teacher";
CREATE UNIQUE INDEX "Teacher_email_key" ON "Teacher"("email");
CREATE UNIQUE INDEX "Teacher_tagId_key" ON "Teacher"("tagId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
