CREATE TABLE "ChapterComment" (
  "id" TEXT NOT NULL,
  "chapterId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "body" VARCHAR(1500) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChapterComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChapterComment_chapterId_createdAt_idx"
  ON "ChapterComment"("chapterId", "createdAt");
CREATE INDEX "ChapterComment_authorId_createdAt_idx"
  ON "ChapterComment"("authorId", "createdAt");

ALTER TABLE "ChapterComment"
  ADD CONSTRAINT "ChapterComment_chapterId_fkey"
  FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChapterComment"
  ADD CONSTRAINT "ChapterComment_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
