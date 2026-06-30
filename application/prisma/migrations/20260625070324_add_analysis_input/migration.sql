/*
  Warnings:

  - A unique constraint covering the columns `[ownerId,label]` on the table `Persona` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "analysisInput" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "Persona_ownerId_label_key" ON "Persona"("ownerId", "label");
