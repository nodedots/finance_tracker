-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "location" TEXT NOT NULL DEFAULT 'Abuja, Nigeria',
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "gmailLinked" BOOLEAN NOT NULL DEFAULT false,
    "smsActive" BOOLEAN NOT NULL DEFAULT false,
    "cameraEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatarUrl", "cameraEnabled", "createdAt", "currency", "email", "gmailLinked", "id", "name", "plan", "pushNotifications", "smsActive", "updatedAt") SELECT "avatarUrl", "cameraEnabled", "createdAt", "currency", "email", "gmailLinked", "id", "name", "plan", "pushNotifications", "smsActive", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
