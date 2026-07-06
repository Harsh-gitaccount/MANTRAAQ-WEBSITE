-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Product_sortOrder_idx" ON "Product"("sortOrder");
