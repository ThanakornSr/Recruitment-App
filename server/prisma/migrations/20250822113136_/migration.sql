/*
  Warnings:

  - You are about to drop the column `status` on the `WSAT_applicants` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WSAT_applicants" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "position" TEXT NOT NULL,
    "dateOfBirth" DATETIME,
    "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" TEXT,
    "createdById" INTEGER,
    CONSTRAINT "WSAT_applicants_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "WSAT_User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WSAT_applicants" ("appliedAt", "createdById", "dateOfBirth", "email", "fullName", "id", "phone", "position", "updatedAt", "updatedBy") SELECT "appliedAt", "createdById", "dateOfBirth", "email", "fullName", "id", "phone", "position", "updatedAt", "updatedBy" FROM "WSAT_applicants";
DROP TABLE "WSAT_applicants";
ALTER TABLE "new_WSAT_applicants" RENAME TO "WSAT_applicants";
CREATE UNIQUE INDEX "WSAT_applicants_email_key" ON "WSAT_applicants"("email");
CREATE INDEX "WSAT_applicants_email_idx" ON "WSAT_applicants"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
