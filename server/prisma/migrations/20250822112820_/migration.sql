/*
  Warnings:

  - You are about to drop the column `coverLetterPath` on the `WSAT_applicants` table. All the data in the column will be lost.
  - You are about to drop the column `cvPath` on the `WSAT_applicants` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `WSAT_applicants` table. All the data in the column will be lost.
  - You are about to drop the column `photoPath` on the `WSAT_applicants` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "WSAT_files" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "uploaderId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WSAT_files_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WSAT_files_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "WSAT_User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WSAT_applicants" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "position" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dateOfBirth" DATETIME,
    "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" TEXT,
    "createdById" INTEGER,
    CONSTRAINT "WSAT_applicants_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "WSAT_User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WSAT_applicants" ("appliedAt", "createdById", "email", "fullName", "id", "phone", "position", "status", "updatedAt", "updatedBy") SELECT "appliedAt", "createdById", "email", "fullName", "id", "phone", "position", "status", "updatedAt", "updatedBy" FROM "WSAT_applicants";
DROP TABLE "WSAT_applicants";
ALTER TABLE "new_WSAT_applicants" RENAME TO "WSAT_applicants";
CREATE UNIQUE INDEX "WSAT_applicants_email_key" ON "WSAT_applicants"("email");
CREATE INDEX "WSAT_applicants_status_idx" ON "WSAT_applicants"("status");
CREATE INDEX "WSAT_applicants_email_idx" ON "WSAT_applicants"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
