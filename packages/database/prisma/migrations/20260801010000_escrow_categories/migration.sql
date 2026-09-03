-- CreateEnum
CREATE TYPE "EscrowCategory" AS ENUM ('FREELANCE', 'ECOMMERCE', 'RENTAL', 'LOGISTICS');

-- AlterTable
ALTER TABLE "escrows" ADD COLUMN     "autoReleaseAt" TIMESTAMP(3),
ADD COLUMN     "category" "EscrowCategory" NOT NULL,
ADD COLUMN     "fundedTxHash" TEXT,
ALTER COLUMN "contractAddress" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "escrows_status_autoReleaseAt_idx" ON "escrows"("status", "autoReleaseAt");

