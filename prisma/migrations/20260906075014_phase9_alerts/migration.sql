-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('OverdueTask', 'OverloadedEmployee', 'StalledProject', 'AgingApproval');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('Warning', 'Critical');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "agingApprovalDays" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "overloadThresholdPercent" INTEGER NOT NULL DEFAULT 80,
ADD COLUMN     "stalledProjectDays" INTEGER NOT NULL DEFAULT 14;

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "employeeId" TEXT,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Alert_companyId_idx" ON "Alert"("companyId");

-- CreateIndex
CREATE INDEX "Alert_companyId_type_idx" ON "Alert"("companyId", "type");

-- CreateIndex
CREATE INDEX "Alert_employeeId_idx" ON "Alert"("employeeId");

-- CreateIndex
CREATE INDEX "Alert_projectId_idx" ON "Alert"("projectId");

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
