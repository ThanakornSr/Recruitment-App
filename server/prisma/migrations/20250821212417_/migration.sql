/*
  Warnings:

  - You are about to drop the `Applicant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Applicant";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "User";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "WSAT_applicants" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "position" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "photoPath" TEXT,
    "cvPath" TEXT,
    "coverLetterPath" TEXT,
    "notes" TEXT,
    "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" TEXT,
    "createdById" INTEGER,
    CONSTRAINT "WSAT_applicants_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "WSAT_User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "applications" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "applicantId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "applications_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "WSAT_applicants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WSAT_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "firstName" TEXT,
    "lastName" TEXT,
    "phoneNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "accessToken" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "loginAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logoutAt" DATETIME,
    CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "WSAT_User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "WSAT_applicants_email_key" ON "WSAT_applicants"("email");

-- CreateIndex
CREATE INDEX "WSAT_applicants_status_idx" ON "WSAT_applicants"("status");

-- CreateIndex
CREATE INDEX "WSAT_applicants_email_idx" ON "WSAT_applicants"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WSAT_User_email_key" ON "WSAT_User"("email");

-- CreateIndex
CREATE INDEX "WSAT_User_email_idx" ON "WSAT_User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_accessToken_key" ON "user_sessions"("accessToken");

-- CreateIndex
CREATE INDEX "user_sessions_accessToken_idx" ON "user_sessions"("accessToken");

-- CreateIndex
CREATE INDEX "user_sessions_userId_idx" ON "user_sessions"("userId");
