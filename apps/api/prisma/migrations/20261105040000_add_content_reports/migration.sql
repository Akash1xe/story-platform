CREATE TYPE "ContentReportTargetType" AS ENUM ('STORY', 'CHAPTER_COMMENT');
CREATE TYPE "ContentReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'HATE_SPEECH', 'SEXUAL_CONTENT', 'VIOLENCE', 'COPYRIGHT', 'OTHER');
CREATE TYPE "ContentReportStatus" AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');

CREATE TABLE "ContentReport" (
  "id" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "reviewerId" TEXT,
  "targetType" "ContentReportTargetType" NOT NULL,
  "targetId" TEXT NOT NULL,
  "targetTitle" TEXT NOT NULL,
  "targetExcerpt" TEXT NOT NULL,
  "targetUrl" TEXT NOT NULL,
  "reason" "ContentReportReason" NOT NULL,
  "details" VARCHAR(1000),
  "status" "ContentReportStatus" NOT NULL DEFAULT 'PENDING',
  "decisionNote" VARCHAR(2000),
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContentReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContentReport_status_createdAt_idx"
  ON "ContentReport"("status", "createdAt");
CREATE INDEX "ContentReport_reporterId_createdAt_idx"
  ON "ContentReport"("reporterId", "createdAt");
CREATE INDEX "ContentReport_targetType_targetId_status_idx"
  ON "ContentReport"("targetType", "targetId", "status");

ALTER TABLE "ContentReport"
  ADD CONSTRAINT "ContentReport_reporterId_fkey"
  FOREIGN KEY ("reporterId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentReport"
  ADD CONSTRAINT "ContentReport_reviewerId_fkey"
  FOREIGN KEY ("reviewerId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
