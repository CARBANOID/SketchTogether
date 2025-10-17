/*
  Warnings:

  - Changed the type of `shape` on the `Shape` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Shape" DROP COLUMN "shape",
ADD COLUMN     "shape" JSONB NOT NULL;
