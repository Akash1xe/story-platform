CREATE TABLE "CreatorFollow" (
  "id" TEXT NOT NULL,
  "followerId" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CreatorFollow_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CreatorFollow_followerId_creatorId_key" ON "CreatorFollow"("followerId", "creatorId");
CREATE INDEX "CreatorFollow_creatorId_createdAt_idx" ON "CreatorFollow"("creatorId", "createdAt");
CREATE INDEX "CreatorFollow_followerId_createdAt_idx" ON "CreatorFollow"("followerId", "createdAt");
ALTER TABLE "CreatorFollow" ADD CONSTRAINT "CreatorFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreatorFollow" ADD CONSTRAINT "CreatorFollow_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
