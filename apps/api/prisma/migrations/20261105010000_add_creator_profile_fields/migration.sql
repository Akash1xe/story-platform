ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "creatorHandle" TEXT,
  ADD COLUMN IF NOT EXISTS "creatorBio" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "creatorWebsiteUrl" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_creatorHandle_key"
  ON "User"("creatorHandle");
