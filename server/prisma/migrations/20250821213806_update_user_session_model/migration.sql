/*
  Warnings:

  - Added the required column `expiresAt` to the `user_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `user_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user_sessions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "accessToken" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "loginAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logoutAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "WSAT_User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user_sessions" ("accessToken", "id", "ipAddress", "isActive", "loginAt", "logoutAt", "userAgent", "userId") SELECT "accessToken", "id", "ipAddress", "isActive", "loginAt", "logoutAt", "userAgent", "userId" FROM "user_sessions";
DROP TABLE "user_sessions";
ALTER TABLE "new_user_sessions" RENAME TO "user_sessions";
CREATE UNIQUE INDEX "user_sessions_accessToken_key" ON "user_sessions"("accessToken");
CREATE INDEX "user_sessions_accessToken_idx" ON "user_sessions"("accessToken");
CREATE INDEX "user_sessions_userId_idx" ON "user_sessions"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
