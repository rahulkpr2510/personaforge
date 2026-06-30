-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'CRAWLING', 'ANALYZING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "TechnicalLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('DESKTOP', 'MOBILE');

-- CreateEnum
CREATE TYPE "SentimentLabel" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- CreateEnum
CREATE TYPE "ScreenshotType" AS ENUM ('FULL_PAGE', 'VIEWPORT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Persona" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "label" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "occupation" TEXT NOT NULL,
    "technicalLevel" "TechnicalLevel" NOT NULL,
    "goals" TEXT NOT NULL,
    "frustrations" TEXT NOT NULL,
    "isPrebuilt" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "normalizedHost" TEXT NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "deviceType" "DeviceType" NOT NULL DEFAULT 'DESKTOP',
    "maxDepth" INTEGER NOT NULL DEFAULT 2,
    "maxPages" INTEGER NOT NULL DEFAULT 8,
    "overallSentiment" "SentimentLabel",
    "overallFrictionScore" INTEGER,
    "summary" TEXT,
    "meta" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "path" TEXT,
    "title" TEXT,
    "depth" INTEGER NOT NULL,
    "content" TEXT,
    "formsCount" INTEGER NOT NULL DEFAULT 0,
    "buttonsCount" INTEGER NOT NULL DEFAULT 0,
    "linksCount" INTEGER NOT NULL DEFAULT 0,
    "textLength" INTEGER NOT NULL DEFAULT 0,
    "hasAuthForm" BOOLEAN NOT NULL DEFAULT false,
    "primaryActionLabel" TEXT,
    "performance" JSONB,
    "accessibility" JSONB,
    "navStructure" JSONB,
    "visionMeta" JSONB,
    "frictionScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Screenshot" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "cdnUrl" TEXT NOT NULL,
    "type" "ScreenshotType" NOT NULL DEFAULT 'FULL_PAGE',
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Screenshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisPersona" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "personaId" TEXT,
    "label" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "occupation" TEXT NOT NULL,
    "technicalLevel" "TechnicalLevel" NOT NULL,
    "goals" TEXT NOT NULL,
    "frustrations" TEXT NOT NULL,
    "firstImpressions" TEXT,
    "positives" TEXT,
    "painPoints" TEXT,
    "recommendations" TEXT,
    "accessibilityNotes" TEXT,
    "adoptionLikelihood" INTEGER,
    "sentiment" "SentimentLabel",
    "frictionScore" INTEGER,
    "evidence" JSONB,
    "rawModelOutput" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisPersona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FocusGroupInsight" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "conflicts" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FocusGroupInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Persona_ownerId_idx" ON "Persona"("ownerId");

-- CreateIndex
CREATE INDEX "Persona_isPrebuilt_isActive_idx" ON "Persona"("isPrebuilt", "isActive");

-- CreateIndex
CREATE INDEX "Analysis_userId_createdAt_idx" ON "Analysis"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Analysis_normalizedHost_idx" ON "Analysis"("normalizedHost");

-- CreateIndex
CREATE INDEX "Analysis_status_idx" ON "Analysis"("status");

-- CreateIndex
CREATE INDEX "Page_analysisId_depth_idx" ON "Page"("analysisId", "depth");

-- CreateIndex
CREATE INDEX "Page_url_idx" ON "Page"("url");

-- CreateIndex
CREATE INDEX "Screenshot_pageId_idx" ON "Screenshot"("pageId");

-- CreateIndex
CREATE INDEX "AnalysisPersona_analysisId_idx" ON "AnalysisPersona"("analysisId");

-- CreateIndex
CREATE INDEX "AnalysisPersona_personaId_idx" ON "AnalysisPersona"("personaId");

-- CreateIndex
CREATE INDEX "AnalysisPersona_sentiment_idx" ON "AnalysisPersona"("sentiment");

-- CreateIndex
CREATE UNIQUE INDEX "FocusGroupInsight_analysisId_key" ON "FocusGroupInsight"("analysisId");

-- AddForeignKey
ALTER TABLE "Persona" ADD CONSTRAINT "Persona_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Screenshot" ADD CONSTRAINT "Screenshot_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisPersona" ADD CONSTRAINT "AnalysisPersona_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisPersona" ADD CONSTRAINT "AnalysisPersona_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocusGroupInsight" ADD CONSTRAINT "FocusGroupInsight_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
