CREATE TYPE "ContentReportAction" AS ENUM ('NONE', 'CONTENT_REMOVED');

ALTER TABLE "ContentReport"
  ADD COLUMN "moderationAction" "ContentReportAction" NOT NULL DEFAULT 'NONE';

ALTER TABLE "ChapterComment"
  ADD COLUMN "removedAt" TIMESTAMP(3),
  ADD COLUMN "removedById" TEXT;

ALTER TABLE "ChapterComment"
  ADD CONSTRAINT "ChapterComment_removedById_fkey"
  FOREIGN KEY ("removedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
