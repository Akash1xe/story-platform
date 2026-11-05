CREATE TYPE "NotificationType" AS ENUM ('NEW_STORY');

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "storyId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL DEFAULT 'NEW_STORY',
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_recipientId_createdAt_idx"
  ON "Notification"("recipientId", "createdAt");
CREATE INDEX "Notification_recipientId_readAt_createdAt_idx"
  ON "Notification"("recipientId", "readAt", "createdAt");

ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_recipientId_fkey"
  FOREIGN KEY ("recipientId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_storyId_fkey"
  FOREIGN KEY ("storyId") REFERENCES "Story"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
