-- AlterTable
ALTER TABLE "escrows" ADD COLUMN     "chainEscrowId" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "escrows_chainEscrowId_key" ON "escrows"("chainEscrowId");
