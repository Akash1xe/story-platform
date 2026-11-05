CREATE TABLE "StoryRating" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "storyId" TEXT NOT NULL,
  "value" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StoryRating_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StoryRating_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StoryRating_storyId_fkey"
    FOREIGN KEY ("storyId") REFERENCES "Story"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StoryRating_value_check" CHECK ("value" >= 1 AND "value" <= 5)
);

CREATE UNIQUE INDEX "StoryRating_userId_storyId_key"
  ON "StoryRating"("userId", "storyId");

CREATE INDEX "StoryRating_storyId_createdAt_idx"
  ON "StoryRating"("storyId", "createdAt");

CREATE INDEX "StoryRating_storyId_value_idx"
  ON "StoryRating"("storyId", "value");
