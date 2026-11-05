CREATE TABLE "ReadingList" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" VARCHAR(40) NOT NULL,
  "description" VARCHAR(160),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReadingList_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ReadingList_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ReadingListEntry" (
  "id" TEXT NOT NULL,
  "listId" TEXT NOT NULL,
  "storyId" TEXT NOT NULL,
  "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReadingListEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ReadingListEntry_listId_fkey"
    FOREIGN KEY ("listId") REFERENCES "ReadingList"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReadingListEntry_storyId_fkey"
    FOREIGN KEY ("storyId") REFERENCES "Story"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ReadingList_userId_name_key"
  ON "ReadingList"("userId", "name");
CREATE INDEX "ReadingList_userId_updatedAt_idx"
  ON "ReadingList"("userId", "updatedAt");
CREATE UNIQUE INDEX "ReadingListEntry_listId_storyId_key"
  ON "ReadingListEntry"("listId", "storyId");
CREATE INDEX "ReadingListEntry_storyId_idx"
  ON "ReadingListEntry"("storyId");
