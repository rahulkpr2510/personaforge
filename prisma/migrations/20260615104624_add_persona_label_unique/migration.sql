/*
  Warnings:

  - A unique constraint covering the columns `[label]` on the table `Persona` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Persona_label_key" ON "Persona"("label");
